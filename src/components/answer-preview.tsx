import Link from 'next/link';
type Row={id:string;text_value:string|null;questions:{title:string}|{title:string}[]|null;question_options:{label:string}|{label:string}[]|null};
export function AnswerPreview({answers,href,own=false}:{answers:Row[];href:string;own?:boolean}){
 return <section className="answer-preview"><div className="section-heading"><div><span className="eyebrow dark">STORIES</span><h2>{own?'나를 소개하는 답변':'이 사람의 이야기'}</h2></div><Link className="text-link" href={href}>모두 보기 →</Link></div>
  {!answers.length&&<div className="notice">{own?'질문에 답하면 이곳에 이야기가 쌓입니다.':'아직 공개한 답변이 없습니다.'}</div>}
  <div className="answer-preview-grid">{answers.map(answer=>{const question=Array.isArray(answer.questions)?answer.questions[0]:answer.questions;const option=Array.isArray(answer.question_options)?answer.question_options[0]:answer.question_options;return <article className="answer-preview-card" key={answer.id}><small>{question?.title}</small><p>{answer.text_value??option?.label}</p></article>})}</div>
 </section>;
}
