import Fuse from 'fuse.js'
import { foldText, genresOf, artistOf } from '../utils/folders.mjs'
import { monthOf, durationOf } from '../utils/music-library.mjs'
export function createMusicSearch(tracks){
 const indexed=tracks.map(track=>({track,title:foldText(track.title),artist:foldText(artistOf(track)),genres:genresOf(track).map(foldText)}))
 const fuse=new Fuse(indexed,{keys:[{name:'title',weight:.6},{name:'artist',weight:.3},{name:'genres',weight:.1}],threshold:.35,ignoreLocation:true,minMatchCharLength:2})
 return ({text='',artist='',genre='',month='',min='',max=''}={})=>{
  const needle=foldText(text).trim(), exact=needle?indexed.filter(r=>`${r.title} ${r.artist} ${r.genres.join(' ')}`.includes(needle)):[]
  const rows=needle?(exact.length?exact.map(r=>r.track):fuse.search(needle).map(r=>r.item.track)):tracks
  return rows.filter(t=>(!artist||foldText(artistOf(t))===foldText(artist))&&(!genre||genresOf(t).some(g=>foldText(g)===foldText(genre)))&&(!month||monthOf(t)===month)&&((min===''&&max==='')||durationOf(t)>0)&& (min===''||durationOf(t)>=Number(min)*60)&&(max===''||durationOf(t)<=Number(max)*60))
 }
}
