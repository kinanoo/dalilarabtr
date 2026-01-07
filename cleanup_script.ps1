New-Item -ItemType Directory -Force -Path "_archive/legacy_scripts"
$files = @(
    "aggressive_fix.js", 
    "aggressive_scrub.js", 
    "article_normalization.js", 
    "check_links.js", 
    "final_safe_obfuscate.js", 
    "fix_leakage.js", 
    "global_syntax_fix.js", 
    "obfuscate_data.js", 
    "purge_garbage.js", 
    "recover_data.js", 
    "repair_structure.js", 
    "systematic_repair.js", 
    "test_imei_decode.js", 
    "ultimate_reencode.js", 
    "universal_recovery.js", 
    "verify_recovery.js"
)

foreach ($f in $files) {
    if (Test-Path $f) {
        Move-Item -Path $f -Destination "_archive/legacy_scripts/" -Force
        Write-Host "Moved $f"
    } else {
        Write-Host "File not found (already moved?): $f"
    }
}
Write-Host "Cleanup Complete."
