param(
  [string]$Base        = "https://mini-projeto-back-postgresql.vercel.app/",
  [string]$Email       = "a@b.com",
  [string]$Password    = "123456",
  [string]$Name        = ("Exercicio Teste " + (Get-Random)), 
  [string]$MuscleGroup = "peito",
  [string]$WeightUnit  = "kg" # "kg" | "lb" | "bodyweight" 
)

Write-Host "== 0) CONFIG =="
Write-Host "BASE=$Base  EMAIL=$Email"
$baseTrim = $Base.TrimEnd('/')

# 1) LOGIN
Write-Host "`n== 1) LOGIN =="
$loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
$login = Invoke-RestMethod -Uri "$baseTrim/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
if (-not $login -or -not $login.token) { throw "Login falhou: token ausente no response." }
$token = $login.token
$headers = @{ Authorization = "Bearer $token" }
Write-Host "Login OK"

# 2) CRIAR EXERCICIO
Write-Host "`n== 2) CRIAR EXERCICIO =="
$createBody = @{
  name        = $Name
  muscleGroup = $MuscleGroup
  weightUnit  = $WeightUnit
} | ConvertTo-Json

try {
  $created = Invoke-RestMethod -Uri "$baseTrim/exercises" -Method Post -Headers $headers -ContentType "application/json" -Body $createBody
  Write-Host "Exercicio criado com sucesso."
  $created | ConvertTo-Json -Depth 8
}
catch {
  Write-Host "Falha ao criar exercicio."
  if ($_.Exception.Response -and $_.Exception.Response.StatusCode.value__) {
    $status = $_.Exception.Response.StatusCode.value__
    Write-Host ("HTTP Status: " + $status)
  }
  # tenta ler o corpo de erro (se houver)
  try {
    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
    $errBody = $reader.ReadToEnd() | ConvertFrom-Json
    if ($errBody) { $errBody | ConvertTo-Json -Depth 8 }
  } catch { }
  throw
}
