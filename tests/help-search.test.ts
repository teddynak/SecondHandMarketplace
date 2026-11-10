import test from 'node:test';
import assert from 'node:assert/strict';
import {HELP_ARTICLES,HELP_START_HERE,HELP_TOPICS} from '../src/content/help';
import {articleHelpPath,helpPath,readHelpLocation,searchHelp} from '../src/lib/help-search';
test('help synonyms find the relevant existing task rather than requiring exact wording',()=>{
 for(const query of ['pictures','photographs','images'])assert.ok(searchHelp(query).some(a=>a.id==='upload-photo'));
 assert.equal(searchHelp('how do I delete my listing?')[0].id,'remove-listing');
 assert.equal(searchHelp('forgot password')[0].id,'reset-password');
 assert.equal(searchHelp('chat messages')[0].id,'inbox');
 assert.ok(searchHelp('blocked account').some(a=>a.id==='suspended-account'));
 assert.equal(searchHelp('zzzxunmatchedterm').length,0);
 assert.ok(searchHelp('PHOTOS').length>0);
});
test('explicit topic filters narrow results and every topic count comes from its articles',()=>{
 assert.ok(searchHelp('photos','listings').every(a=>a.topic==='listings'));
 assert.equal(searchHelp('forgot password','selling').length,0);
 assert.ok(searchHelp('forgot password','all').length>0);
 assert.equal(HELP_TOPICS.reduce((sum,t)=>sum+searchHelp('',t.id).length,0),HELP_ARTICLES.length);
});
test('help URLs restore queries, ignore unknown values and reveal conflicting article links',()=>{
 const state={query:'photo cover',topic:'listings' as const,articleId:''};
 assert.deepEqual(readHelpLocation(new URL(helpPath(state),'https://reuse.example.test')),state);
 for(const topic of ['unknown','constructor','__proto__'])assert.equal(readHelpLocation(new URL(`https://reuse.example.test/how-it-works?topic=${topic}`)).topic,'all');
 assert.equal(readHelpLocation(new URL('https://reuse.example.test/how-it-works?topic=Photos')).topic,'listings');
 const linked=readHelpLocation(new URL('https://reuse.example.test/how-it-works?q=zzzxunmatchedterm&topic=selling#upload-photo'));
 assert.deepEqual(linked,{query:'',topic:'listings',articleId:'upload-photo'});
 assert.equal(readHelpLocation(new URL('https://reuse.example.test/how-it-works#%E0%A4%A')).articleId,'');
 assert.equal(readHelpLocation(new URL('https://reuse.example.test/how-it-works?q='+ 'x'.repeat(200))).query.length,120);
});
test('all legacy answer IDs survive and start-here/action links point to real help entries',()=>{
 const legacy=['used-items','find-items','contact-seller','inbox','block-report','pay-and-pickup','saved-items','publish-listing','edit-listing','sold-listing','remove-listing','upload-photo','cover-photo','draft-preview','account','account-security','notifications','profile-contact','sign-in','moderation','meet-safely','private-information'];
 const ids=HELP_ARTICLES.map(a=>a.id);assert.equal(new Set(ids).size,ids.length);
 for(const id of legacy)assert.ok(ids.includes(id),id);
 for(const entry of HELP_START_HERE)assert.ok(ids.includes(entry.id));
 for(const article of HELP_ARTICLES)for(const link of article.links){assert.ok(link.href.startsWith('/'));if(link.href.startsWith('/how-it-works#'))assert.ok(ids.includes(link.href.split('#')[1]));}
 assert.equal(articleHelpPath('upload-photo'),'/how-it-works#upload-photo');
 assert.equal(articleHelpPath('unknown'),'/how-it-works');
});
