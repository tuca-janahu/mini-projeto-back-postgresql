param(
  [string]$Base = "http://localhost:3000",
  [string]$Email = "a@b.com",
  [string]$Password = "123456",
  [string]$Label = "Peito B"
)
Write-Host "== 0) CONFIG =="
Write-Host "BASE=$Base  EMAIL=$Email"

# 1) LOGIN
Write-Host "`n== 1) LOGIN =="
$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
$baseTrim = $Base.TrimEnd('/')

$login = Invoke-RestMethod -Uri "$baseTrim/auth/login" `
  -Method Post -ContentType "application/json" -Body $loginBody

if (-not $login -or -not $login.token) {
  throw "Login falhou: token ausente no response."
}
$token = $login.token
$headers = @{ Authorization = "Bearer $token" }
Write-Host "Login OK"

# 2) LISTAR EXERCICIOS (3)
Write-Host "`n== 2) EXERCICIOS (3) =="
# Escapar & com crase para evitar parsing do PowerShell
$exUrl = "$baseTrim/exercises?page=1`&limit=3"

$exResp = Invoke-RestMethod -Uri $exUrl -Method Get -Headers $headers
$items = @($exResp.items)
if ($items.Count -eq 0) { throw "Nao ha exercicios cadastrados." }

# Monta [{ exerciseId: number }]
$exArray = $items | ForEach-Object { @{ exerciseId = [int]$_.id } }
Write-Host ("Exercicios: " + ($exArray.exerciseId -join ", "))

# 3) CRIAR TRAINING DAY
Write-Host "`n== 3) CRIAR TRAINING DAY =="
$dayBody = @{
  label     = $Label
  exercises = $exArray
} | ConvertTo-Json -Depth 6

$day = Invoke-RestMethod -Uri "$baseTrim/training-days" `
  -Method Post -Headers $headers -ContentType "application/json" -Body $dayBody

Write-Host "Training Day criado com sucesso."
$day | ConvertTo-Json -Depth 8