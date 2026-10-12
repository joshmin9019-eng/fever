export type FortuneSign={name:string;symbol:string;from:string;messages:[string,string,string]};

// FEVER original entertainment copy. No third-party horoscope text is reproduced.
export const fortuneSigns:FortuneSign[]=[
 {name:'염소자리',symbol:'♑',from:'12.22~1.19',messages:['작은 약속을 지키는 일이 오늘의 좋은 흐름을 만듭니다.','서두르지 않고 한 가지에 집중하면 마음이 한결 가벼워집니다.','먼저 안부를 건네면 예상 밖의 다정한 답장이 올 수 있어요.']},
 {name:'물병자리',symbol:'♒',from:'1.20~2.18',messages:['익숙한 길을 조금 바꾸면 재미있는 발견이 기다립니다.','독특한 생각을 편하게 꺼내 보세요. 대화가 더 풍성해집니다.','혼자만의 시간 뒤에 누군가와 나누는 이야기가 반가울 거예요.']},
 {name:'물고기자리',symbol:'♓',from:'2.19~3.20',messages:['오늘은 마음이 끌리는 음악 한 곡이 좋은 시작이 됩니다.','상대의 말을 끝까지 들어 주면 서로 더 가까워질 수 있어요.','잠깐 쉬어 가는 시간이 다음 아이디어를 데려옵니다.']},
 {name:'양자리',symbol:'♈',from:'3.21~4.19',messages:['하고 싶었던 작은 일에 먼저 손을 대 보세요.','활기찬 인사가 오늘의 좋은 만남을 시작합니다.','속도를 조금만 늦추면 놓쳤던 마음이 보입니다.']},
 {name:'황소자리',symbol:'♉',from:'4.20~5.20',messages:['좋아하는 맛을 천천히 즐기며 하루를 시작해 보세요.','편안한 분위기에서 나눈 대화가 오래 기억될 수 있어요.','꾸준히 해 온 일에서 작은 만족을 발견하는 날입니다.']},
 {name:'쌍둥이자리',symbol:'♊',from:'5.21~6.21',messages:['새로운 질문 하나가 재미있는 대화로 이어집니다.','생각을 가볍게 나누면 뜻밖의 공통점을 찾을 수 있어요.','오늘 떠오른 아이디어를 메모해 두면 나중에 빛날 거예요.']},
 {name:'게자리',symbol:'♋',from:'6.22~7.22',messages:['편한 사람에게 먼저 안부를 전해 보세요.','나를 잘 돌보는 시간이 다른 사람을 이해할 여유도 줍니다.','소박한 계획 하나가 하루를 포근하게 채웁니다.']},
 {name:'사자자리',symbol:'♌',from:'7.23~8.22',messages:['당신의 밝은 에너지가 주변에도 전해지는 날입니다.','잘한 일을 스스로 인정하면 다음 걸음이 쉬워집니다.','관심 있는 이야기에 솔직하게 반응해 보세요.']},
 {name:'처녀자리',symbol:'♍',from:'8.23~9.22',messages:['작은 정리가 마음에도 여유를 만들어 줍니다.','세심하게 건넨 한마디가 누군가에게 힘이 될 수 있어요.','완벽한 답보다 진솔한 대화가 더 즐거운 날입니다.']},
 {name:'천칭자리',symbol:'♎',from:'9.23~10.22',messages:['서로 다른 취향에서 의외의 재미를 찾을 수 있어요.','오늘은 먼저 웃으며 말을 걸어 보면 어떨까요?','한쪽으로 치우치지 않는 선택이 마음을 편하게 합니다.']},
 {name:'전갈자리',symbol:'♏',from:'10.23~11.22',messages:['궁금했던 주제를 깊이 이야기해 보기 좋은 날입니다.','진심을 담은 짧은 말이 긴 설명보다 닿을 수 있어요.','집중하고 싶은 일에 시간을 내면 만족감이 커집니다.']},
 {name:'사수자리',symbol:'♐',from:'11.23~12.21',messages:['가보지 않은 곳을 상상하는 것만으로도 기분이 새로워집니다.','새로운 사람의 이야기에 귀를 기울여 보세요.','평소와 다른 선택 하나가 재미있는 추억이 될 수 있어요.']}
];

export function validMonthDay(month:number,day:number){
 return Number.isInteger(month)&&Number.isInteger(day)&&month>=1&&month<=12&&day>=1&&day<=new Date(2024,month,0).getDate();
}
export function signFor(month:number,day:number):FortuneSign|null{
 if(!validMonthDay(month,day))return null;
 const date=month*100+day;
 const index=date>=1222||date<=119?0:date<=218?1:date<=320?2:date<=419?3:date<=520?4:date<=621?5:date<=722?6:date<=822?7:date<=922?8:date<=1022?9:date<=1122?10:11;
 return fortuneSigns[index];
}
export function zodiacFor(year:number){
 const names=['쥐','소','호랑이','토끼','용','뱀','말','양','원숭이','닭','개','돼지'];
 return names[((year-4)%12+12)%12];
}
export function dailyFortune(sign:FortuneSign,today:string,year:number){
 const dateNumber=Number(today.replaceAll('-',''));
 const index=(dateNumber+fortuneSigns.indexOf(sign)*7+year)%sign.messages.length;
 return sign.messages[index];
}
