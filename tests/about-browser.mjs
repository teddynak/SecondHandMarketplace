import assert from 'node:assert/strict';
export async function verifyAbout({page,origin,screenshotDir}){
 const main=page.locator('main');const nav=page.getByRole('navigation',{name:'About this page'});
 for(const width of [320,375,768,1024,1440,1920]){
  await page.setViewportSize({width,height:1000});await page.goto(origin+'/about');await page.waitForLoadState('networkidle');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`About overflow at ${width}`);
  const columns=await main.locator('section[aria-labelledby="about-title"]>div').evaluate(grid=>getComputedStyle(grid).gridTemplateColumns.split(' ').length);
  assert.equal(columns,width>=1024?2:1,`Hero layout at ${width}`);
  assert.equal(await main.getByRole('heading',{level:1}).count(),1);
  for(const anchor of await nav.locator('a').all()){const box=await anchor.boundingBox();assert.ok(box.height>=44,`Small anchor target at ${width}`);}
 }
 // Same-page keyboard navigation must leave the destination below the sticky header.
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [375,1440])for(const id of ['about-us','our-mission','what-belongs']){
  await page.setViewportSize({width,height:1000});await page.goto(origin+'/about');const link=nav.locator(`a[href="#${id}"]`);await link.focus();await page.keyboard.press('Enter');
  await page.waitForURL(url=>url.pathname==='/about'&&url.hash===`#${id}`);
  await page.waitForFunction(id=>{const top=document.getElementById(id).getBoundingClientRect().top;const bottom=document.querySelector('.site-header').getBoundingClientRect().bottom;return top>=bottom+4&&top<=bottom+70;},id);
  assert.equal(await page.locator(`#${id}`).evaluate(section=>section===document.activeElement),true,'Keyboard anchor did not focus its destination');
 }
 await page.goto(origin+'/about');
 const destinations={'Explore used items':'/marketplace','Sell a used item':'/sell','Pass on a used item':'/sell','Find practical guidance in our Help centre':'/how-it-works'};
 for(const [name,href] of Object.entries(destinations))for(const link of await main.getByRole('link',{name,exact:true}).all())assert.equal(await link.getAttribute('href'),href);
 // Check body text against the darkest hero/mission lavender and light CTA text against purple.
 const colors=await page.locator('section[aria-labelledby="about-title"] p, #our-mission p, section[aria-labelledby="about-closing-title"] p').evaluateAll(nodes=>nodes.map(node=>({color:getComputedStyle(node).color,dark:!!node.closest('[aria-labelledby="about-closing-title"]')})));
 const luminance=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0);
 for(const {color,dark} of colors){const foreground=luminance(color.match(/[\d.]+/g).slice(0,3).map(Number));const background=luminance(dark?[76,29,149]:[238,229,250]);assert.ok((Math.max(foreground,background)+.05)/(Math.min(foreground,background)+.05)>=4.5,`Low About body contrast: ${color}`);}
 assert.equal(await page.evaluate(()=>getComputedStyle(document.documentElement).scrollBehavior),'auto');
 if(screenshotDir){const {mkdir}=await import('node:fs/promises');await mkdir(screenshotDir,{recursive:true});for(const [name,width] of [['about-desktop',1440],['about-mobile',375]]){await page.setViewportSize({width,height:1000});await page.goto(origin+'/about');await page.locator('[data-about-photo="electronics"]').scrollIntoViewIfNeeded();await page.waitForFunction(()=>Array.from(document.querySelectorAll('[data-about-photo] img')).every(img=>img.complete));await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${screenshotDir}/${name}.png`,fullPage:true});}}
 // A broken CDN image should retain its dimensions and a meaningful fallback.
 const failedPhoto=page.locator('[data-about-photo="books"]');const before=await failedPhoto.boundingBox();
 const image=failedPhoto.locator('img');if(await image.count())await image.evaluate(img=>img.dispatchEvent(new Event('error')));
 await failedPhoto.getByRole('img',{name:'Books illustration: stories worth passing on'}).waitFor();const after=await failedPhoto.boundingBox();assert.ok(Math.abs(before.width-after.width)<1&&Math.abs(before.height-after.height)<1,'Image failure moved the hero layout');
 assert.equal(await failedPhoto.locator('img').count(),0);
 if(screenshotDir){await page.evaluate(()=>window.scrollTo(0,0));await page.screenshot({path:`${screenshotDir}/about-image-fallback.png`});}
 await page.emulateMedia({reducedMotion:'no-preference'});
 // Follow actual primary links, including the unauthenticated seller entry point.
 await main.getByRole('link',{name:'Explore used items',exact:true}).first().click();await page.waitForURL(url=>url.pathname==='/marketplace');
 await page.goto(origin+'/about');await main.getByRole('link',{name:'Sell a used item',exact:true}).first().click();await page.waitForURL(url=>url.pathname==='/sell');await page.getByRole('heading',{name:'Ready to give something a new home?',exact:true}).waitFor();
 await page.goto(origin+'/about');await main.getByRole('link',{name:'Find practical guidance in our Help centre',exact:true}).click();await page.waitForURL(url=>url.pathname==='/how-it-works');await page.getByRole('searchbox',{name:'Search help articles'}).waitFor();
 console.log('PASS: About redesign fits six widths, keeps keyboard anchors below the header, preserves routes, meets body contrast, respects reduced motion and retains a usable image fallback.');
}
