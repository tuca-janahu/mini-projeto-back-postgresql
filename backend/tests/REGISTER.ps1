param(
  [string]$Base     = "http://localhost:3000",
  [string]$Email    = "novo.user@example.com",
  [string]$Name     = "Novo User",
  [string]$Password = "123456"
)

Write-Host "== REGISTRO DE USUARIO =="
Write-Host "BASE=$Base"
Write-Host "EMAIL=$Email"
Write-Host "NAME=$Name"

$baseTrim = $Base.TrimEnd('/')

try {
  Write-Host "`n== 0) CHECK EMAIL  =="
  $check = Invoke-RestMethod -Uri "$baseTrim/auth/check-email?email=$([uri]::EscapeDataString($Email))" -Method Get
  if ($check -and $check.available -eq $false) {
    throw "Email indisponivel."
  }
  Write-Host "Email disponivel."
} catch {
  Write-Host "Aviso: rota de check-email indisponivel ou email ja usado. Prosseguindo com registro..."
}

# 1) REGISTRAR
Write-Host "`n== 1) REGISTER =="
$registerBody = @{
  email    = $Email
  name     = $Name
  password = $Password
} | ConvertTo-Json

$registerResp = Invoke-RestMethod -Uri "$baseTrim/auth/register" -Method Post -ContentType "application/json" -Body $registerBody
Write-Host "Registro concluido."
$registerResp | ConvertTo-Json -Depth 8

# 2) OPCIONAL: LOGIN para validar credenciais e obter token
try {
  Write-Host "`n== 2) LOGIN =="
  $loginBody = @{ email = $Email; password = $Password } | ConvertTo-Json
  $login = Invoke-RestMethod -Uri "$baseTrim/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
  if ($login -and $login.token) {
    Write-Host "Login OK. Token obtido."
    # Mostre apenas o inicio do token por seguranca
    $prefix = $login.token.Substring(0, [Math]::Min(20, $login.token.Length))
    Write-Host ("Token (prefixo): " + $prefix + "...")
  } else {
    Write-Host "Login retornou sem token."
  }
} catch {
  Write-Host "Login opcional falhou: $($_.Exception.Message)"
}
