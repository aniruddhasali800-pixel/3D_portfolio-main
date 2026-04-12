# Automation Script to Push/Overwrite 3D Portfolio to GitHub
# Target: https://github.com/aniruddhasali800-pixel/3D_portfolio-main.git

Write-Host "Updating remote URL..." -ForegroundColor Cyan
git remote set-url origin "https://github.com/aniruddhasali800-pixel/3D_portfolio-main.git"

Write-Host "Staging all files..." -ForegroundColor Cyan
git add .

Write-Host "Creating deployment commit..." -ForegroundColor Cyan
git commit -m "Full project deployment: Replacing existing content with local portfolio"

Write-Host "Force-pushing to GitHub (main branch)..." -ForegroundColor Yellow
git push -u origin main --force

Write-Host "`nDeployment Complete!" -ForegroundColor Green
Pause
