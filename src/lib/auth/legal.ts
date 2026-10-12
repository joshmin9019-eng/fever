import "server-only";
export function legalConfig(){
 const termsUrl=process.env.FEVER_TERMS_URL ?? "";
 const privacyUrl=process.env.FEVER_PRIVACY_URL ?? "";
 const termsVersion=process.env.FEVER_TERMS_VERSION ?? "";
 const privacyVersion=process.env.FEVER_PRIVACY_VERSION ?? "";
 const validUrl=(url:string)=>{try{return new URL(url).protocol === "https:";}catch{return false;}};
 return {termsUrl,privacyUrl,termsVersion,privacyVersion,ready:Boolean(validUrl(termsUrl)&&validUrl(privacyUrl)&&termsVersion&&privacyVersion)};
}
