-- Expand the shared vocabulary for ideal types and self styles.
-- Existing selections stay intact; running this migration again is safe.
begin;
insert into public.ideal_type_options(category,label,sort_order) values
 ('분위기','토끼상',3),('분위기','여우상',4),('분위기','곰상',5),
 ('분위기','선한 인상',6),('분위기','시크한 인상',7),('분위기','웃는 모습이 좋은',8),
 ('체형','아담한 편',4),('체형','키가 큰 편',5),('체형','건강한 편',6),('체형','보통 체형',7),
 ('성향','주도적인',5),('성향','차분하게 이끄는',6),('성향','표현이 적극적인',7),
 ('성격','성실함',7),('성격','긍정적',8),('성격','섬세함',9),('성격','독립적',10),
 ('성격','공감 잘하는',11),('성격','호기심 많은',12),('성격','안정적인',13),('성격','표현 잘하는',14)
on conflict(category,label) do nothing;
commit;
