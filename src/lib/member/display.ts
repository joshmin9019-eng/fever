export function genderClass(gender: string | null | undefined) {
 return gender === "male" ? "gender-male" : gender === "female" ? "gender-female" : "gender-neutral";
}
export function ageDecade(birthYear: number | null | undefined) {
 if (!birthYear) return "";
 const year = Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Asia/Seoul" }).format(new Date()));
 return `${Math.floor((year - birthYear + 1) / 10) * 10}대`;
}
