type IdealType={category:string;label:string;sort_order:number};
export function IdealTypeDisplay({items}:{items:IdealType[]}){
 if(!items.length)return null;
 return <section className="ideal-display"><span className="eyebrow dark">IDEAL TYPE</span><h2>마음이 가는 스타일</h2><div className="ideal-groups">{['분위기','체형','성향','성격'].map(category=>{const choices=items.filter(item=>item.category===category).sort((a,b)=>a.sort_order-b.sort_order);return choices.length?<div key={category}><strong>{category}</strong><div className="tag-list">{choices.map(choice=><span key={choice.label}>{choice.label}</span>)}</div></div>:null})}</div></section>;
}
