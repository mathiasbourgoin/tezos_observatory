export type RenderedColor=[number,number,number,number];
export interface RenderedColors {
 begin():void;
 parse(value:string):RenderedColor;
 over(front:RenderedColor,back:RenderedColor):RenderedColor;
 ratio(front:RenderedColor,back:RenderedColor):number;
 backgrounds(element:Element,regions?:readonly DOMRect[]):RenderedColor[];
}
declare global {interface Window {v3RenderedColors?:RenderedColors}}

/** Browser-side measurement shared by the production matrix and its focused regressions. */
export function installRenderedColors():void {
 if(window.v3RenderedColors)return;
 type Color=[number,number,number,number];
 const probe=document.createElement('span');probe.setAttribute('aria-hidden','true');probe.style.cssText='position:fixed;visibility:hidden;pointer-events:none;width:0;height:0;';document.body.append(probe);
 const colors=new Map<string,Color>();
 const parse=(value:string):Color=>{
  const cached=colors.get(value);if(cached)return cached;
  if(!CSS.supports('color',value))throw new Error(`Unsupported rendered color ${value}`);
  probe.style.color=value;const resolved=getComputedStyle(probe).color;
  const rgb=resolved.match(/^rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/);
  const srgb=resolved.match(/^color\(srgb\s+([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)(?:\s*\/\s*([\d.e+-]+))?\s*\)$/);
  const parts=rgb??srgb;if(!parts)throw new Error(`Unsupported rendered color ${resolved}`);
  const scale=srgb?255:1,result:Color=[Number(parts[1])*scale,Number(parts[2])*scale,Number(parts[3])*scale,parts[4]===undefined?1:Number(parts[4])];
  if(result.some(channel=>!Number.isFinite(channel)))throw new Error(`Invalid rendered color ${resolved}`);
  colors.set(value,result);return result;
 };
 const over=(front:Color,back:Color):Color=>{const alpha=front[3]+back[3]*(1-front[3]);return [0,1,2].map(index=>((front[index]??0)*front[3]+(back[index]??0)*back[3]*(1-front[3]))/(alpha||1)).concat(alpha) as Color;};
 const luminance=(color:Color)=>[.2126,.7152,.0722].reduce((sum,weight,index)=>{const value=(color[index]??0)/255;return sum+weight*(value<=.04045?value/12.92:((value+.055)/1.055)**2.4);},0);
 const ratio=(a:Color,b:Color)=>(Math.max(luminance(a),luminance(b))+.05)/(Math.min(luminance(a),luminance(b))+.05);
 type Bands={pre:number;att:number;preColor:Color;attColor:Color};
 const bandCache=new Map<string,Bands>();let styles=new WeakMap<Element,CSSStyleDeclaration>();
 const styleOf=(element:Element):CSSStyleDeclaration=>{let style=styles.get(element);if(!style){style=getComputedStyle(element);styles.set(element,style);}return style;};
 const bands=(element:Element,style:CSSStyleDeclaration):Bands|undefined=>{
  if(style.backgroundImage==='none')return undefined;
  const unsupported=()=>new Error(`Unmeasured background image on ${element.className}`);
  if(!element.matches('.navigator-current,.navigator-path-card'))throw unsupported();
  const preText=style.getPropertyValue('--path-pre').trim()||'0%',attText=style.getPropertyValue('--path-att').trim()||'0%';
  const percent=(value:string):number=>{if(!/^\d+(?:\.\d+)?%$/.test(value))throw unsupported();const n=parseFloat(value);if(n<0||n>100)throw unsupported();return n/100;};
  const pre=percent(preText),att=percent(attText),preToken=style.getPropertyValue('--pre').trim(),attToken=style.getPropertyValue('--att').trim();
  const properties=['backgroundImage','backgroundSize','backgroundPosition','backgroundRepeat','backgroundOrigin','backgroundClip','backgroundAttachment','backgroundBlendMode'] as const;
  const signature=properties.map(property=>style[property]).join('|');const cached=bandCache.get(signature);if(cached)return cached;
  // Let the engine canonicalize color-mix and layer syntax; accept only these exact two bands.
  probe.style.setProperty('--pre',preToken);probe.style.setProperty('--att',attToken);probe.style.setProperty('--path-pre',preText);probe.style.setProperty('--path-att',attText);
  probe.style.background='linear-gradient(90deg,color-mix(in srgb,var(--pre) 26%,transparent) 0 var(--path-pre,0%),transparent var(--path-pre,0%) 100%) top left/100% 50% no-repeat,linear-gradient(90deg,color-mix(in srgb,var(--att) 18%,transparent) 0 var(--path-att,0%),transparent var(--path-att,0%) 100%) bottom left/100% 50% no-repeat,transparent';
  const reference=getComputedStyle(probe);if(properties.some(property=>style[property]!==reference[property]))throw unsupported();
  const result={pre,att,preColor:parse(`color-mix(in srgb,${preToken} 26%,transparent)`),attColor:parse(`color-mix(in srgb,${attToken} 18%,transparent)`)};
  bandCache.set(signature,result);return result;
 };
 const backgrounds=(element:Element,regions:readonly DOMRect[]=[element.getBoundingClientRect()]):Color[]=>{
  const ancestors:Element[]=[];for(let node:Element|null=element;node;node=node.parentElement)ancestors.unshift(node);
  const layers=ancestors.map(node=>{const style=styleOf(node),fill=bands(node,style),box=node.getBoundingClientRect();return {node,style,fill,box,left:box.left+parseFloat(style.borderLeftWidth||'0'),top:box.top+parseFloat(style.borderTopWidth||'0'),width:box.width-parseFloat(style.borderLeftWidth||'0')-parseFloat(style.borderRightWidth||'0'),height:box.height-parseFloat(style.borderTopWidth||'0')-parseFloat(style.borderBottomWidth||'0')};});
  const found=new Map<string,Color>();
  for(const region of regions){
   let left=region.left,right=region.right,top=region.top,bottom=region.bottom;
   for(const layer of layers)if(/hidden|auto|scroll|clip/.test(layer.style.overflow+layer.style.overflowX+layer.style.overflowY)){left=Math.max(left,layer.box.left);right=Math.min(right,layer.box.right);top=Math.max(top,layer.box.top);bottom=Math.min(bottom,layer.box.bottom);}
   if(right<=left||bottom<=top)continue;
   const xs=[left,right],ys=[top,bottom];
   for(const layer of layers)if(layer.fill){xs.push(layer.left,layer.left+layer.width*layer.fill.pre,layer.left+layer.width*layer.fill.att,layer.left+layer.width);ys.push(layer.top,layer.top+layer.height/2,layer.top+layer.height);}
   const cuts=(values:number[],low:number,high:number)=>[...new Set(values.filter(value=>value>=low&&value<=high))].sort((a,b)=>a-b),xCuts=cuts(xs,left,right),yCuts=cuts(ys,top,bottom);
   for(let x=1;x<xCuts.length;x++)for(let y=1;y<yCuts.length;y++){
    const px=(xCuts[x-1]!+xCuts[x]!)/2,py=(yCuts[y-1]!+yCuts[y]!)/2;let color:Color=[255,255,255,1];
    for(const layer of layers){
     color=over(parse(layer.style.backgroundColor),color);const fill=layer.fill;
     if(fill&&px>=layer.left&&px<layer.left+layer.width&&py>=layer.top&&py<layer.top+layer.height){const upper=py<layer.top+layer.height/2;if(px<layer.left+layer.width*(upper?fill.pre:fill.att))color=over(upper?fill.preColor:fill.attColor,color);}
    }
    found.set(color.map(channel=>channel.toFixed(8)).join(','),color);
   }
  }
  return [...found.values()];
 };
 window.v3RenderedColors={begin:()=>{styles=new WeakMap();},parse,over,ratio,backgrounds};
}
