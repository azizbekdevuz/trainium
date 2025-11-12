#!/usr/bin/env node

/**
 * Script to generate ERD diagrams from Prisma schema
 * This temporarily enables ERD generators, runs prisma generate, then restores the schema
 * 
 * NOTE: This script requires Mermaid CLI (mmdc) which doesn't work well on Windows.
 * For Windows users, consider using WSL (Windows Subsystem for Linux) or run this on Linux/Mac.
 * 
 * Alternative: Use Prisma Studio or online ERD tools to visualize your schema.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const schemaPath = path.join(__dirname, '..', 'prisma', 'schema.prisma');
const backupPath = path.join(__dirname, '..', 'prisma', 'schema.prisma.backup');
const erdsDir = path.join(__dirname, '..', 'prisma', 'ERDs');

// Create ERDs directory if it doesn't exist
if (!fs.existsSync(erdsDir)) {
  fs.mkdirSync(erdsDir, { recursive: true });
}

// Read the schema
const schemaContent = fs.readFileSync(schemaPath, 'utf-8');

// Create backup
fs.writeFileSync(backupPath, schemaContent);

try {
  // Uncomment only the Mermaid generator (text format, no CLI needed)
  // Other formats (PNG, PDF, SVG) require mmdc CLI which doesn't work well on Windows
  const modifiedSchema = schemaContent
    .replace(/^\/\/ generator erd_mermaid \{/gm, 'generator erd_mermaid {')
    .replace(/^\/\/   provider = "prisma-erd-generator"/gm, '  provider = "prisma-erd-generator"')
    .replace(/^\/\/   output   = "\.\/ERDs\/ERD\.mmd"/gm, '  output   = "./ERDs/ERD.mmd"')
    .replace(/^\/\/   format   = "mermaid"/gm, '  format   = "mermaid"')
    .replace(/^\/\/ \}/gm, '}');

  // Write modified schema
  fs.writeFileSync(schemaPath, modifiedSchema);

  console.log('📊 Generating ERD diagram (Mermaid format)...');
  console.log('💡 Tip: You can convert the .mmd file to PNG/SVG using online tools or Mermaid CLI.\n');
  
  // Run prisma generate
  let erdGenerationSuccess = false;
  try {
    execSync('pnpm --filter @apps/web prisma:generate', {
      stdio: 'inherit',
      cwd: path.join(__dirname, '..')
    });
    erdGenerationSuccess = true;
    console.log('\n✅ ERD generation completed successfully!');
  } catch (error) {
    // Check if any ERD files were generated despite errors
    let erdFiles = [];
    try {
      erdFiles = fs.readdirSync(erdsDir).filter(f => 
        f.endsWith('.mmd') || f.endsWith('.svg') || f.endsWith('.png') || f.endsWith('.pdf') || f.endsWith('.dot')
      );
    } catch (dirError) {
      // Directory might not exist or be readable
    }
    
    if (erdFiles.length > 0) {
      erdGenerationSuccess = true;
      console.log(`\n⚠️  Some ERD generators failed, but ${erdFiles.length} file(s) were generated:`);
      erdFiles.forEach(f => console.log(`   - ${f}`));
      console.log('\n📁 Check the prisma/ERDs/ directory for generated files.');
      console.log('💡 Tip: On Windows, Mermaid format (.mmd) works best. For PNG/PDF/SVG, use WSL or Linux.');
    } else {
      // No files generated
      console.log('\n❌ ERD generation failed. This is a known issue on Windows.');
      console.log('\n💡 Solutions:');
      console.log('   1. Use WSL (Windows Subsystem for Linux): wsl pnpm erd:generate');
      console.log('   2. Run on Linux/Mac where Mermaid CLI works properly');
      console.log('   3. Use Prisma Studio: pnpm --filter @apps/web prisma:studio');
      console.log('   4. Use online ERD tools with your schema.prisma file');
      throw new Error('ERD generation requires Mermaid CLI which is not available on Windows');
    }
  }
  
  if (!erdGenerationSuccess) {
    throw new Error('ERD generation failed and no files were created');
  }

} catch (error) {
  console.error('❌ Error generating ERD diagrams:', error.message);
  process.exit(1);
} finally {
  // Restore original schema
  if (fs.existsSync(backupPath)) {
    fs.writeFileSync(schemaPath, fs.readFileSync(backupPath, 'utf-8'));
    fs.unlinkSync(backupPath);
    console.log('🔄 Schema file restored to original state.');
  }
}

