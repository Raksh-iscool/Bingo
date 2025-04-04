Write-Host "🚀 Pre-Push Tests Starting..."
Write-Host ""

# ✅ Test 1: Lint Check
Write-Host "🧐 Test 1: Running Lint Check..."
bun run lint
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Lint Check Failed! Fix errors before pushing."
    exit 1
} else {
    Write-Host "✅ Lint Check Passed!"
}

Write-Host ""

# 🔨 Test 2: Build Test
Write-Host "🏗️ Test 2: Running Build Test..."
bun run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build Failed! Fix errors before pushing."
    exit 1
} else {
    Write-Host "✅ Build Passed!"
}

Write-Host ""
Write-Host "🎉 All Tests Passed! Pushing to Repository..."


