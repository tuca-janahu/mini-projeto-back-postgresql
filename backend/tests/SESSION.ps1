param(
  [string]$Base         = "https://mini-projeto-back-postgresql.vercel.app/",
  [string]$Email        = "a@b.com",
  [string]$Password     = "123456",
  [int]   $TrainingDayId= 1,
  [string]$Notes        = ""
)

Write-Host "== 0) CONFIG =="
Write-Host "BASE=$Base  EMAIL=$Email  TrainingDayId=$TrainingDayId"
$baseTrim = $Base.TrimEnd('/')

# 1) LOGIN
Write-Host "`n== 1) LOGIN =="
$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$baseTrim/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
if (-not $login -or -not $login.token) { throw "Login falhou: token ausente no response." }
$headers = @{ Authorization = "Bearer " + $login.token }
Write-Host "Login OK"

# 2) GET /training-days/:id -> para pegar os exercícios desse dia
Write-Host "`n== 2) GET /training-days/$TrainingDayId =="
$day = Invoke-RestMethod -Uri "$baseTrim/training-days/$TrainingDayId" -Method Get -Headers $headers
$dayItems = @($day.items)
if ($dayItems.Count -eq 0) { throw "Esse training day nao possui itens/exercicios." }

# 3) Montar exercises da sessão
# Regra: 3 séries x 10 reps, com um peso por exercício ciclando 10/20/30 kg (mesmo peso nas 3 séries)
$weights = @(10, 20, 30)
$exercisesPayload = @()

for ($i = 0; $i -lt $dayItems.Count; $i++) {
  # compatível com Windows PowerShell 5.1 (sem ?? / ?.)
  $eid = $null
  if ($dayItems[$i].PSObject.Properties.Name -contains "exerciseId" -and $dayItems[$i].exerciseId) {
    $eid = [int]$dayItems[$i].exerciseId
  } elseif ($dayItems[$i].PSObject.Properties.Name -contains "exercise" -and $dayItems[$i].exercise -ne $null) {
    if ($dayItems[$i].exercise.PSObject.Properties.Name -contains "id" -and $dayItems[$i].exercise.id) {
      $eid = [int]$dayItems[$i].exercise.id
    }
  }
  if (-not $eid -or $eid -le 0) { continue }

  $w = $weights[$i % $weights.Count]

  $sets = @(
    @{ reps = 10; weight = $w },
    @{ reps = 10; weight = $w },
    @{ reps = 10; weight = $w }
  )

  $exercisesPayload += @{ exerciseId = $eid; sets = $sets }
}

if ($exercisesPayload.Count -eq 0) { throw "Nao foi possivel montar exercises da sessao." }

Write-Host ("Exercicios na sessao: " + ($exercisesPayload.exerciseId -join ", "))
Write-Host ("Pesos por exercicio (ciclando): " + ($weights -join ", "))

# 4) CRIAR TRAINING SESSION  (campos que o seu controller espera)
Write-Host "`n== 4) CRIAR TRAINING SESSION =="
$performedAt = (Get-Date).ToString("o")  # ISO 8601

$payload = @{
  trainingDayId = $TrainingDayId
  performedAt   = $performedAt
  exercises     = $exercisesPayload   # <— nome correto
  notes         = $Notes
} | ConvertTo-Json -Depth 8

try {
  $resp = Invoke-RestMethod -Uri "$baseTrim/training-sessions" -Method Post -Headers $headers -ContentType "application/json" -Body $payload
  Write-Host "Sessao criada com sucesso."
  $resp | ConvertTo-Json -Depth 8
}
catch {
  Write-Host "Falha ao criar a sessao."
  try {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $err = $reader.ReadToEnd()
    Write-Host $err
  } catch {}
  throw
}
