import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import {createSystem} from '../src/system.js';
test('logo password prompt waits for both passwords, toggles, and resets on cancel',async()=>{
 class Element{value='';textContent='';open=false;events={};addEventListener(k,v){this.events[k]=v;}focus(){}showModal(){this.open=true;}close(){this.open=false;this.events.close?.();}}
 const nodes=new Map(),get=id=>{if(!nodes.has(id))nodes.set(id,new Element());return nodes.get(id);},letter=new Element(),messages=[];
 const verifyWalletPassword=async (value,step)=>value===(step===1?'TestFirst':'TestSecond');
 const system=createSystem({getItem:()=>null,setItem(){}},undefined,verifyWalletPassword);
 const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8').split('// The lettering keeps its normal appearance')[1];
 runInNewContext('// The lettering keeps its normal appearance'+source,{$:get,document:{querySelectorAll:()=>[letter]},system,verifyWalletPassword,notify:text=>messages.push(text)});
 const open=()=>letter.events.click({preventDefault(){},stopPropagation(){}});
 const submit=async value=>{get('#brand-password').value=value;await get('#brand-form').events.submit({preventDefault(){}});};
 open();await submit('testfirst');assert.equal(system.snapshot().unlimitedCoins,false);assert.equal(get('#brand-dialog-title').textContent,'Password');
 await submit('TestFirst');assert.equal(get('#brand-dialog-title').textContent,'Second password');assert.equal(system.snapshot().unlimitedCoins,false);
 await submit('wrong');assert.equal(get('#brand-dialog').open,true);assert.equal(system.snapshot().unlimitedCoins,false);
 await submit('TestSecond');assert.equal(system.snapshot().unlimitedCoins,true);assert.equal(get('#brand-dialog').open,false);
 open();await submit('TestFirst');get('#brand-cancel').events.click();open();await submit('TestSecond');assert.equal(system.snapshot().unlimitedCoins,true);assert.equal(get('#brand-dialog-title').textContent,'Password');
 await submit('TestFirst');await submit('TestSecond');assert.equal(system.snapshot().unlimitedCoins,false);assert.deepEqual(messages,['Unlimited coins on.','Unlimited coins off.']);
});
