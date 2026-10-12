export function validNickname(value:string){return /^[가-힣A-Za-z0-9_]{2,20}$/.test(value);}
export function validAvatar(bytes:Uint8Array,type:string){
 if(bytes.length===0||bytes.length>5*1024*1024)return false;
 if(type==="image/jpeg")return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
 if(type==="image/png")return [137,80,78,71,13,10,26,10].every((value,index)=>bytes[index]===value);
 if(type==="image/webp")return new TextDecoder().decode(bytes.slice(0,4))==="RIFF"&&new TextDecoder().decode(bytes.slice(8,12))==="WEBP";
 return false;
}
