import {dailyFortune,signFor,zodiacFor} from '@/lib/fortune';
import {saveBirthdate,deleteBirthdate} from '@/app/fortune/actions';
export function FortunePanel({today,year,month,day,saved,error,deleted}:{today:string;year:number;month:number|null;day:number|null;saved:boolean;error:string|null;deleted:boolean}){
 const sign=month&&day?signFor(month,day):null;
 return <section className="fortune-panel"><span className="eyebrow dark">A LITTLE MOMENT FOR YOU</span><h1>오늘의 별자리 운세</h1><p>프로필의 출생연도 {year}년과 아래에서 선택한 월·일로 보는 FEVER의 재미 운세예요.</p>
  {error&&<p className="form-error" role="alert">{error==='date'?'올바른 태어난 월·일을 선택해 주세요.':'저장 내용을 확인하지 못했습니다. 생년월일과 DB 설정을 확인해 주세요.'}</p>}
  {saved&&<p className="notice" role="status">생일의 월·일을 저장했습니다.</p>}{deleted&&<p className="notice" role="status">저장한 월·일을 삭제했습니다.</p>}
  <form action={saveBirthdate} className="fortune-picker"><label htmlFor="fortuneMonth">태어난 월</label><select id="fortuneMonth" name="month" defaultValue={month??''} required><option value="" disabled>월 선택</option>{Array.from({length:12},(_,i)=><option key={i+1} value={i+1}>{i+1}월</option>)}</select><label htmlFor="fortuneDay">태어난 일</label><select id="fortuneDay" name="day" defaultValue={day??''} required><option value="" disabled>일 선택</option>{Array.from({length:31},(_,i)=><option key={i+1} value={i+1}>{i+1}일</option>)}</select><label className="fortune-consent"><input type="checkbox" name="consent" required/>입력한 월·일로 운세를 보고 이달의 생일자에 닉네임과 월·일을 공개하는 데 동의합니다.</label><button className="button green" type="submit">{sign?'생일 수정':'생일 저장하고 운세 보기'}</button></form>
  {sign&&<article className="fortune-result"><span className="fortune-symbol" aria-hidden="true">{sign.symbol}</span><div><small>{today} · {sign.from}</small><h2>{sign.name} · {zodiacFor(year)}띠</h2><p>{dailyFortune(sign,today,year)}</p><span>출생연도 기준 띠예요. 음력 설 경계는 반영하지 않습니다.</span></div></article>}
  {sign&&<form action={deleteBirthdate}><button className="fortune-clear" type="submit">저장한 생일 월·일 삭제</button></form>}
  <p className="fortune-disclaimer">FEVER가 직접 쓴 재미 운세입니다. 실제 미래를 예측하거나 외부 운세를 가져온 내용은 아닙니다.</p>
 </section>;
}
