import {HELP_ARTICLES,HELP_TOPICS,type HelpArticle,type HelpTopicId} from '@/content/help';
const groups=[['photo','photos','picture','pictures','image','images','photograph','photographs'],['message','messages','messaging','chat','chats','conversation','conversations','inbox'],['remove','removing','removal','delete','deleting','deletion','archive','archived'],['recovery','recover','forgot','forgotten','reset','resetting'],['password','passwords'],['upload','uploads','uploading'],['block','blocked','blocking'],['suspend','suspended','suspension'],['verify','verified','verification'],['approve','approved','approval'],['listing','listings','advert','ad','ads'],['item','items']];
const synonyms=new Map(groups.flatMap(group=>group.map(word=>[word,group[0]] as const)));
const stop=new Set(['a','an','and','are','can','do','does','for','how','i','in','is','it','my','of','on','or','the','to','with','you','your']);
function words(value:string){return value.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().match(/[a-z0-9]+/g)??[];}
function index(value:string){return new Set(words(value).flatMap(word=>[word,synonyms.get(word)??word]));}
export function helpTerms(query:string){return [...new Set(words(query.slice(0,120)).filter(word=>!stop.has(word)).map(word=>synonyms.get(word)??word))];}
export function helpTopicLabel(id:HelpTopicId){return HELP_TOPICS.find(topic=>topic.id===id)?.label??'All topics';}
function score(article:HelpArticle,terms:string[]){
 const title=index(article.title),keywords=index(article.keywords.join(' '));const body=index([article.body,...(article.steps??[]),article.note??'',helpTopicLabel(article.topic)].join(' '));
 let score=0;for(const term of terms){const matches=(tokens:Set<string>)=>[...tokens].some(token=>token===term||token.startsWith(term));if(matches(title))score+=10;else if(matches(keywords))score+=5;else if(matches(body))score+=1;else return -1;}return score;
}
export function searchHelp(query:string,topic:HelpTopicId='all'){
 const terms=helpTerms(query);
 return HELP_ARTICLES.map((article,order)=>({article,order,score:score(article,terms)})).filter(result=>(topic==='all'||result.article.topic===topic)&&result.score>=0).sort((a,b)=>b.score-a.score||a.order-b.order).map(result=>result.article);
}
export type HelpLocation={query:string;topic:HelpTopicId;articleId:string};
export const EMPTY_HELP:HelpLocation={query:'',topic:'all',articleId:''};
export function readHelpLocation(url:URL):HelpLocation{
 const raw=(url.searchParams.get('topic')??'all').toLowerCase();
 const legacy=new Map<string,HelpTopicId>([['all topics','all'],['photos','listings'],['your account','account'],['safety','safety']]);
 let topic:HelpTopicId=legacy.get(raw)??HELP_TOPICS.find(topic=>topic.id===raw||topic.label.toLowerCase()===raw)?.id??'all';
 let query=(url.searchParams.get('q')??'').slice(0,120);let articleId='';
 try{const candidate=decodeURIComponent(url.hash.slice(1));const article=HELP_ARTICLES.find(article=>article.id===candidate);if(article){articleId=article.id;if(!searchHelp(query,topic).some(result=>result.id===article.id)){topic=article.topic;query='';}}}catch{/* Ignore malformed, unknown fragment identifiers. */}
 return {query,topic,articleId};
}
export function helpPath(state:HelpLocation){const params=new URLSearchParams();if(state.query.trim())params.set('q',state.query.trim());if(state.topic!=='all')params.set('topic',state.topic);const search=params.toString();return `/how-it-works${search?'?'+search:''}${state.articleId?'#'+encodeURIComponent(state.articleId):''}`;}
export function articleHelpPath(id:string){return HELP_ARTICLES.some(article=>article.id===id)?`/how-it-works#${encodeURIComponent(id)}`:'/how-it-works';}
