# DOC Watch public deploy: Lambda + Function URL (same pattern as Doc AI)
$ErrorActionPreference = "Continue"
$PSNativeCommandUseErrorActionPreference = $false
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
$env:AWS_DEFAULT_REGION = if ($env:AWS_DEFAULT_REGION) { $env:AWS_DEFAULT_REGION } else { "us-east-1" }
$env:AWS_REGION = $env:AWS_DEFAULT_REGION
$Region = $env:AWS_DEFAULT_REGION
$Fn = "docwatch-mcp"
$RoleName = "docwatch-lambda-role"
$Root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
Set-Location $Root

Write-Host "Building Lambda zip..."
npm run build:lambda
if ($LASTEXITCODE -ne 0) { throw "build:lambda failed" }

$Account = aws sts get-caller-identity --query Account --output text
$RoleArn = "arn:aws:iam::${Account}:role/${RoleName}"

$trust = @'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": { "Service": "lambda.amazonaws.com" },
    "Action": "sts:AssumeRole"
  }]
}
'@
$trustPath = Join-Path $env:TEMP "docwatch-trust.json"
Set-Content -Path $trustPath -Value $trust -Encoding ascii

aws iam get-role --role-name $RoleName 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Creating IAM role $RoleName"
  aws iam create-role --role-name $RoleName --assume-role-policy-document "file://$trustPath" | Out-Null
  aws iam attach-role-policy --role-name $RoleName --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole | Out-Null
  # Polly for /api/tts on the live URL (optional; UI falls back to browser voice)
  $pollyPolicy = @'
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["polly:SynthesizeSpeech", "polly:DescribeVoices"],
    "Resource": "*"
  }]
}
'@
  $pollyPath = Join-Path $env:TEMP "docwatch-polly.json"
  Set-Content -Path $pollyPath -Value $pollyPolicy -Encoding ascii
  aws iam put-role-policy --role-name $RoleName --policy-name DocWatchPolly --policy-document "file://$pollyPath" | Out-Null
  Start-Sleep -Seconds 10
}

$zip = Join-Path $Root "dist-lambda.zip"
$envFile = Join-Path $env:TEMP "docwatch-lambda-env.json"
@'
{
  "Variables": {
    "MOCK_RING": "true",
    "DOCWATCH_DATA": "/var/task/data/locations.json",
    "AWS_NODE_CONFIG_MAX_TOTAL_TIMEOUT": "28000"
  }
}
'@ | Set-Content -Path $envFile -Encoding ascii

aws lambda get-function --function-name $Fn --region $Region 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Creating function $Fn"
  aws lambda create-function `
    --function-name $Fn `
    --runtime nodejs22.x `
    --role $RoleArn `
    --handler index.handler `
    --zip-file "fileb://$zip" `
    --timeout 30 `
    --memory-size 512 `
    --architectures arm64 `
    --environment "file://$envFile" `
    --region $Region | Out-Null
} else {
  Write-Host "Updating function code $Fn"
  aws lambda update-function-code --function-name $Fn --zip-file "fileb://$zip" --region $Region | Out-Null
  Start-Sleep -Seconds 4
  aws lambda update-function-configuration `
    --function-name $Fn `
    --timeout 30 `
    --memory-size 512 `
    --environment "file://$envFile" `
    --region $Region | Out-Null
}

Start-Sleep -Seconds 3

$existing = aws lambda get-function-url-config --function-name $Fn --region $Region 2>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Creating Function URL..."
  aws lambda create-function-url-config `
    --function-name $Fn `
    --auth-type NONE `
    --cors "AllowOrigins=*,AllowMethods=*,AllowHeaders=*,ExposeHeaders=mcp-session-id,MaxAge=86400" `
    --region $Region | Out-Null
}

# Public invoke permissions (both needed for Function URL auth NONE)
$permUrl = aws lambda add-permission `
  --function-name $Fn `
  --statement-id FunctionURLAllowPublicAccess `
  --action lambda:InvokeFunctionUrl `
  --principal "*" `
  --function-url-auth-type NONE `
  --region $Region 2>&1
$permInvoke = aws lambda add-permission `
  --function-name $Fn `
  --statement-id FunctionURLAllowInvoke `
  --action lambda:InvokeFunction `
  --principal "*" `
  --region $Region 2>&1

$url = aws lambda get-function-url-config --function-name $Fn --region $Region --query FunctionUrl --output text
$url = $url.TrimEnd('/')
Set-Content -Path (Join-Path $PSScriptRoot "last-lambda-url.txt") -Value $url -Encoding ascii
Write-Host ""
Write-Host "DOC Watch live URL: $url"
Write-Host "  UI:     $url/"
Write-Host "  Alexa+: $url/index.html"
Write-Host "  Demo:   $url/demo.html"
Write-Host "  Health: $url/health"
Write-Host "  MCP:    POST $url/mcp"
