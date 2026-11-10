import {ImageResponse} from 'next/og';
export const alt='ReUse Market — Used items. New possibilities. Uganda.';
export const size={width:1200,height:630};
export const contentType='image/png';
export default function Image(){return new ImageResponse(<div style={{display:'flex',flexDirection:'column',justifyContent:'center',width:'100%',height:'100%',background:'#f0e7ff',padding:90,color:'#261738'}}><div style={{display:'flex',fontSize:35,color:'#7129dc',marginBottom:32}}>ReUse Market · Uganda</div><div style={{display:'flex',fontSize:84,lineHeight:1.12,fontWeight:700}}>Used items.</div><div style={{display:'flex',fontSize:84,lineHeight:1.12,fontWeight:700,color:'#7129dc'}}>New possibilities.</div><div style={{display:'flex',fontSize:27,marginTop:38}}>Buy. Sell. Keep good things going.</div></div>,size);}
