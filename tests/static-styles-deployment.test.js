import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,rmSync,existsSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
test('Pages packages every local stylesheet linked by the home page, including game controls',()=>{
 const root=fileURLToPath(new URL('../',import.meta.url)),workflow=readFileSync(join(root,'.github/workflows/pages.yml'),'utf8'),copy=workflow.split('\n').map(s=>s.trim()).find(s=>s.startsWith('cp index.html ')),target=mkdtempSync(join(tmpdir(),'sidequest-styles-'));
 try{assert.ok(copy,'the static package copies the home page');execFileSync('/bin/sh',['-c',copy.replace('_site/','"$1/"'),'package-styles',target],{cwd:root});const copySource=workflow.split('\n').map(s=>s.trim()).find(s=>s==='cp -R src _site/src');assert.ok(copySource);execFileSync('/bin/sh',['-c',copySource.replace('_site/','"$1/"'),'package-styles',target],{cwd:root});const html=readFileSync(join(target,'index.html'),'utf8'),links=[...html.matchAll(/<link\b[^>]*rel=["']stylesheet["'][^>]*>/g)].map(m=>m[0].match(/href=["']([^"']+)/)?.[1]).filter(href=>href&&!/^https?:/.test(href));assert.ok(links.length>=2);for(const href of links)assert.ok(existsSync(resolve(target,href)),`${href} must be in the deployed package`);}finally{rmSync(target,{recursive:true,force:true});}
});
