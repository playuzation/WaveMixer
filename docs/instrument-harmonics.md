# 악기별 배음 구성 조사

피아노, 기타, 베이스, 바이올린, 성인 여성의 '아' 발성, 트럼펫, 리코더, 실로폰의 소리가 어떤 배음으로 이루어지는지 정리한 자료입니다. WaveMixer에서 코사인파를 더해 음색을 흉내 낼 때 참고용으로 씁니다.

- 조사일: 2026-10-27
- 수치는 악기 개체, 음 높이, 세기, 연주법, 측정 방법에 따라 크게 달라집니다. 아래 값은 **대표적인 경향**으로 보아 주세요.
- 출처 원문을 직접 열람하지 못하고 웹 검색 결과에 인용된 내용으로 정리했습니다(자세한 내용은 [조사 한계](#조사-한계)). 각 항목 끝의 [번호]는 [참고 자료](#참고-자료)의 출처 번호입니다.
- *(추론)* 표시는 출처에 직접 나온 내용이 아니라 출처 내용을 바탕으로 계산하거나 해석한 부분입니다.

## 용어

| 용어 | 뜻 |
| --- | --- |
| 기본 주파수 f₀ | 음 높이를 결정하는 가장 낮은 반복 주파수 |
| 배음(harmonic) | f₀의 정수배 성분 n·f₀. n = 1이 기본음, n = 2가 2배음 |
| 부분음(partial) | 실제 소리를 이루는 성분. 정수배에서 벗어날 수 있음 |
| 비조화성(inharmonicity) | 부분음이 정수배에서 벗어나는 정도 |
| 포먼트(formant) | 음 높이와 관계없이 고정된 주파수 대역에서 성분이 강해지는 스펙트럼 봉우리 |
| dB/oct | 주파수가 2배(1옥타브) 될 때 세기가 줄어드는 정도. −6 dB/oct면 진폭이 1/n에 비례 |

## 한눈에 보기

| 악기 | 부분음 위치 | 세기 분포 | 음색을 결정하는 요인 |
| --- | --- | --- | --- |
| 피아노 | 정수배보다 조금씩 높음(고차일수록 더 높음) | 해머 타점이 마디인 배음이 약함(1/7 지점 → 7배음). 세게 칠수록 고배음 증가 | 현의 강성, 해머 펠트, 타점 |
| 기타 | 거의 정수배 | 대략 sin(nπR)/n²로 감소. 튕긴 지점이 마디인 배음은 빠짐 | 튕기는 위치, 손끝·피크 폭, 몸통 |
| 베이스 | 거의 정수배 | 측정 사례에서 2배음이 기본음보다 약 12 dB 강함. 17배음 부근까지 유의미 | 튕기는 위치, 픽업 위치 |
| 바이올린 | 정수배 | 현의 구동력이 톱니파에 가까워 약 1/n로 감소, 몸통 공명과 브리지 힐(약 2.5 kHz)이 걸러냄 | 헬름홀츠 운동, 몸통·브리지 |
| 목소리(여성 '아') | 정수배(f₀ 약 220 Hz) | 전체적으로 약 −6 dB/oct로 감소하면서 포먼트 F1≈850, F2≈1220, F3≈2810 Hz 근처가 강조됨 | 성대 음원 + 성도 필터 |
| 트럼펫 | 정수배(홀수·짝수 모두) | 포먼트 1200~1400 Hz, 약 2500 Hz. 세게 불수록 고배음 증가 | 벨·마우스피스, 비선형 전파 |
| 리코더 | 정수배(반정수 성분이 함께 관측되기도 함) | 기본음이 지배적이고 배음은 약함. 홀수 배음이 우세하다는 측정도 있음 | 에어 제트와 엣지, 관 |
| 실로폰 | 깎지 않은 막대는 1 : 2.76 : 5.40 : 8.93(비정수) → 깎아서 1 : 3으로 조율 | 소리가 빨리 감쇠(저음 약 1초 ~ 고음 약 1/50초). 단단한 말렛일수록 고배음 증가 | 막대 언더컷, 공명관, 말렛 경도 |

## 피아노

- **비조화성:** 피아노 현은 단단해서(강성) 부분음이 정수배보다 조금씩 높습니다. n번째 부분음은 다음 식으로 근사합니다.

  f_n ≈ n · f₁ · √(1 + B·n²)

  B는 비조화성 계수로, 현의 길이·지름·장력·재질로 정해집니다. 중음역에서 약 10⁻⁴이고, 가장 높은 음 쪽으로 가면 약 10⁻²까지 커집니다. 가장 낮은 현은 큰 그랜드 피아노에서 약 10⁻⁴, 업라이트에서는 10⁻³까지 갑니다. [1][2]
- *(추론)* 예: B = 10⁻⁴이면 10번째 부분음이 10·f₁·√1.01 ≈ 10.05·f₁로, 정수배보다 약 0.5 % 높습니다.
- **해머 타점:** 해머는 전통적으로 현 길이의 1/7~1/9 지점을 칩니다. 1/7, 1/8, 1/9 지점을 치면 그 지점이 마디인 7, 8, 9배음이 각각 약해집니다. 다만 해머가 닿는 점도 움직이므로 배음이 완전히 사라지지는 않고, 이 범위를 조금 벗어난 타점이 더 좋게 들렸다는 보고도 있습니다. [3][4]
- **세기와 음색:** 펠트 해머는 약하게 치면 부드러운 스프링처럼, 세게 치면 훨씬 단단한 물체처럼 작동합니다. 그래서 세게 칠수록 고배음이 많아집니다. 정음(voicing)으로 해머를 부드럽게 하자 스펙트럼 상한이 약 8 kHz에서 약 4 kHz로 내려간 실험이 있습니다. [5][6]
- **두 단계 감쇠:** 처음에는 빨리 줄어드는 소리(prompt sound)가, 그다음에는 그 1/4 이하 속도로 천천히 줄어드는 소리(aftersound)가 이어집니다. 한 음에 여러 줄의 현이 걸려 서로 결합하는 것이 주원인입니다. [7]

## 기타

- **튕긴 줄의 배음:** 이상적으로 튕긴 줄(삼각형 모양에서 놓음)에서 n번째 모드의 진폭은 다음에 비례합니다. [8]

  sin(nπR) / n²     (R = 브리지에서 튕긴 지점까지 거리 ÷ 줄 길이)

  배음 번호가 커질수록 빠르게 줄어들고, sin(nπR) = 0인 배음은 빠집니다.
- **빠지는 배음:** 튕긴 지점이 마디인 배음은 브리지로 전달되는 힘에서 빠집니다. 예를 들어 줄 길이의 1/5 지점을 튕기면 5, 10, 15…배음이, 한가운데를 튕기면 짝수 배음이 사라집니다. [8][9]
- **브리지 가까이 vs 멀리:** 브리지 가까이에서 튕기면 밝고, 멀리서 튕기면 따뜻한 소리가 납니다. [10]
- **손끝·피크 폭:** 실제 손끝이나 피크는 폭이 있어 줄을 둥근 모양으로 당기므로 고배음을 줄이는 저역 통과 필터처럼 작동합니다. 피크가 단단할수록 고배음이 많습니다. 줄과 몸통(앞판)의 상호작용은 처음 파형에 없던 배음까지 울리며 소리를 다시 바꿉니다. [8][9]

## 베이스 (일렉트릭 베이스)

- **기본음보다 강한 2배음:** Fender 베이스의 최저음 E(41.2 Hz)를 측정했더니, 82.4 Hz의 2배음이 기본음보다 **약 12 dB 높았고**, 유의미한 배음이 17배음(약 700 Hz)까지 이어졌다는 보고가 있습니다. 다른 P-베이스 측정에서도 2배음이 기본음보다 약간 강했습니다. 악기·픽업·연주법에 따라 달라집니다. [11][12]
- *(추론)* 기본음이 약해도 음 높이가 41 Hz로 들리는 것은 배음 간격(41 Hz)으로 기본음을 복원해 듣는 현상(missing fundamental) 때문입니다. WaveMixer가 파형의 최대공약수를 음 높이로 쓰는 것과 같은 원리입니다.
- **튕기는 위치와 픽업 위치:** 기타와 같은 원리로 튕긴 지점의 마디 배음이 빠집니다. 픽업도 자기 위치가 마디인 배음을 약하게 받으므로 빗살 필터처럼 작동하고, 픽업 폭은 더 높은 주파수에서 추가 빗살 효과를 만듭니다. [10]

## 바이올린

- **헬름홀츠 운동:** 활로 켠 현에서는 꺾인 점(Helmholtz corner)이 현을 따라 왕복합니다. 이 점이 활을 지날 때마다 붙음과 미끄러짐이 바뀌고, 브리지에 걸리는 힘은 **톱니파**에 가까워집니다. 배음이 풍부하면서도 엄밀하게 주기적입니다. [13][14]
- *(추론)* 이상적인 톱니파의 n번째 배음 진폭은 1/n에 비례합니다(−6 dB/oct). 실제로는 꺾임이 둥글어져 고배음이 더 약해집니다. [13]
- **몸통이 거는 필터:** 현의 톱니파 힘을 몸통 공명이 걸러서 내보냅니다. 측정된 바이올린 예시는 다음과 같습니다. [15][16]

  | 공명 | 주파수 |
  | --- | --- |
  | A0 (몸통 안 공기, 헬름홀츠 공명) | 약 278~285 Hz |
  | B1− (몸통 굽힘 모드) | 약 422~466 Hz |
  | B1+ (몸통 굽힘 모드) | 약 528~574 Hz |
  | 브리지 힐 (브리지 공명) | 약 2.5 kHz |

  그래서 같은 음이라도 배음마다 이 공명에 가까운 것은 크게, 먼 것은 작게 나옵니다.

## 사람의 목소리 (성인 여성의 '아')

- **음원-필터 모델:** 성대가 만드는 음원은 f₀의 정수배 배음을 모두 갖고 약 **−12 dB/oct**로 줄어듭니다. 입술에서 소리가 퍼져 나가는 효과(방사)가 약 +6 dB/oct를 더하므로, 모음 전체로는 약 **−6 dB/oct** 기울기가 됩니다. 이 위에 성도(목·입 안)의 공명이 **포먼트**로 특정 대역의 배음을 키웁니다. [17][18]
- **여성 '아'의 수치 (미국 영어 /ɑ/, Peterson & Barney 1952):** [19][20][21]

  | 항목 | 값 |
  | --- | --- |
  | f₀ (여성 평균) | 약 224 Hz |
  | F1 | 약 850 Hz |
  | F2 | 약 1220 Hz |
  | F3 | 약 2810 Hz |

  같은 모음을 다시 측정한 Hillenbrand et al.(1995)은 F1·F2 평균값이 이와 여러 군데 다르다고 보고했습니다. [22]
- *(추론)* f₀ = 220 Hz라면 배음은 220, 440, 660, 880, 1100, 1320 … Hz입니다. 이 중 **4배음(880 Hz)** 이 F1 근처, **5·6배음(1100·1320 Hz)** 이 F2 근처, **13배음(2860 Hz)** 이 F3 근처라서 상대적으로 강해집니다. 배음 위치는 음 높이를 따라 움직이고, 포먼트는 모음에 따라 고정되어 있다는 점이 핵심입니다.
- **한국어 '아':** 한국어 단모음의 포먼트를 남녀 화자로 측정한 연구(Yang 1992, 1996)가 있으나, 이번 조사에서 여성 /아/의 수치를 확인하지 못했습니다. 여성의 포먼트가 남성보다 전반적으로 높다는 점은 한국어 연구에서도 같습니다. [23][24]

## 트럼펫

- **완전한 배음렬:** 입술 쪽이 닫힌 원통형 관만 있으면 홀수 배음만 공명하지만, 나팔 모양 벨이 공명 주파수를 서로 다른 만큼 올려 완전한 배음렬(홀수·짝수 모두)에 가깝게 만듭니다. 그래서 홀수 배음이 우세한 클라리넷과 달리 트럼펫은 짝수 배음도 강합니다. [25][26]
- **포먼트:** 첫 포먼트 약 **1200~1400 Hz**, 둘째 포먼트 약 **2500 Hz**로 정리된 표가 있습니다(Backus). [27]
- **세기와 밝기:** 여리게 불면 2·3배음 정도까지만 뚜렷하고, 세게 불수록 에너지가 더 높은 배음까지 퍼집니다(Risset의 분석). 원통형 관을 지나는 동안 파면이 비선형으로 가팔라지는 것이 원인이며, 이 변화가 트럼펫 음색 지각에서 큰 몫을 차지합니다. [28][29][30]

## 리코더

- **기본음이 지배적:** 현대 목제 리코더의 스펙트럼은 강한 기본음과 약한 배음 몇 개로 이루어지고, 숨소리 같은 잡음 성분이 섞입니다. 리코더 제작자의 측정에서도 기본음이 가장 큽니다. 같은 원리로 소리 나는 플루트는 여리게 불면 사인파에 가깝고 세게 불수록 고배음이 커집니다. [31][32][33]
- **배음 구성:** 성분은 주로 n·f₁(정수배)이지만, 취구 끝(labium) 근처 공기 흐름과 관련된 반정수배(1.5·f₁ 등) 성분도 관측됩니다(Giordano & Saenger 2023). [34]
- **홀수 배음 우세 보고:** 리코더는 양쪽이 열린 관인데도 닫힌 관처럼 짝수 배음이 약하게 나타난다는 연구가 있습니다. 반면 역사적 알토 리코더 측정에서는 '기본음이 지배적인 유형'부터 '배음이 풍부한 유형'까지 다섯 유형의 스펙트럼이 나왔습니다. 악기와 음에 따라 차이가 큽니다. [35][36]

## 실로폰

- **깎지 않은 막대:** 양 끝이 자유로운 균일한 막대의 진동 모드 비는 **1 : 2.76 : 5.40 : 8.93**으로 정수배가 아닙니다. [37]
- **조율:** 막대 아랫면을 깎아(언더컷) 기본음 바로 위 부분음을 **3배(1옥타브+5도, 12도)** 에 맞춥니다. 같은 방식으로 마림바는 **4배**와 약 **9.2~10배**에 맞춥니다. 깎는 위치를 바꾸면 부분음을 하나씩 조율할 수 있습니다. [37][38][39]
- **공명관:** 막대 아래 관은 기본음에 맞춰 조율되어 소리를 키우고 음색을 부드럽게 합니다. 한쪽이 닫힌 관은 기본음의 홀수배에서도 공명하므로 3배음을 함께 키울 수 있습니다. [40]
- **감쇠:** 소리가 저음 쪽 약 1초에서 고음 쪽 약 1/50초 만에 사라질 만큼 빨리 감쇠해서, 음을 길게 내려면 트레몰로(빠른 연타)를 씁니다. [41][42]
- **말렛:** 단단한 말렛은 고배음을 키워 밝은 소리를, 부드러운 말렛은 고배음을 줄여 둥근 소리를 냅니다. [40]

## WaveMixer와의 관계

현재 WaveMixer의 제약과 이 조사 결과를 연결하면 다음과 같습니다. *(추론)*

- **진폭 조절:** 파동마다 진폭(배율 0.001~10)을 줄 수 있어 포먼트나 강한 배음을 나타낼 수 있습니다. 악기 샘플은 피아노·바이올린을 1/n, 기타를 sin(nπ/5)/n² 식으로 계산했습니다. 나머지(베이스·여성 '아'·트럼펫·리코더·실로폰)는 이 조사의 설명을 바탕으로 정한 상대 진폭 *(추정)*입니다.
- **비정수 부분음:** 피아노 비조화성이나 깎지 않은 실로폰 막대처럼 정수비가 아닌 부분음은 최대공약수를 아주 작게 만들어, 음계 재생에서 소리가 가청 범위를 벗어날 수 있습니다. 조율된 비율(실로폰 1:3, 마림바 1:4:10)은 문제없습니다. 그래서 피아노 비조화성(B = 10⁻⁴)과 조금씩 어긋난 줄 세 개는 목록이 아니라 「음계로 듣기」의 「타격」 울림에서만 적용합니다.
- **시간 변화:** 「음계로 듣기」의 **울림**(지속·튕김·타격·막대·활·관)으로 배음마다 다른 어택과 감쇠를 낼 수 있습니다. 악기 샘플을 고르면 그 악기의 울림이 골라집니다. 값과 근거는 [realistic-sound-research.md](realistic-sound-research.md)의 「WaveMixer에 적용한다면」 4번에 있습니다. 세기에 따른 음색 변화는 아직 표현할 수 없고, 목록·합성음 재생은 정상 상태의 배음 구성입니다.

## 조사 한계

- 작업 환경의 네트워크 정책 때문에 출처 페이지 본문을 직접 열지 못했습니다. 웹 검색 결과에 인용된 문장과 수치로 정리했습니다.
- 여성 /ɑ/ 포먼트(Peterson & Barney 1952)의 F1·F2·F3는 원 논문 표가 아니라 이를 인용한 서로 다른 2차 출처에서 각각 확인했습니다. 원 논문 표 II와 Watrous(1991)의 정정을 대조해 보는 것이 좋습니다.
- 한국어 여성 /아/의 포먼트 수치는 찾지 못했습니다.
- 베이스의 2배음 우세는 측정 사례(오디오 잡지, 사용자 측정)에 근거하며 악기마다 다를 수 있습니다.
- 리코더는 출처마다 짝수·홀수 배음 경향이 엇갈립니다.

## 참고 자료

1. [Acta Acustica (2021), 피아노 현 비조화성 계수 B의 범위](https://acta-acustica.edpsciences.org/10.1051/aacus/2021002)
2. [arXiv 1203.5101, Entropy-based Tuning of Musical Instruments (비조화성 식)](https://arxiv.org/pdf/1203.5101)
3. [Conklin – Piano design factors: where should the hammer strike?](https://www.speech.kth.se/music/5_lectures/conklin/whereshould.html)
4. [US Patent 4674386 – Augmented bass hammer striking distance for pianos](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/4674386)
5. [KTH, Askenfelt – 해머 비선형성](https://www.speech.kth.se/music/5_lectures/askenflt/nonlinea.html)
6. [Russell (Penn State) – Hammer nonlinearity, dynamics and the piano sound](https://www.acs.psu.edu/drussell/Piano/Dynamics.html)
7. [KTH, Weinreich – 피아노 현의 운동과 두 단계 감쇠](https://www.speech.kth.se/music/5_lectures/weinreic/motion.html)
8. [Traub & Smith (2001), 기타 현 합성 – 모드 진폭 sin(nπR)/n²](https://www.ee.columbia.edu/~dpwe/papers/TraubS01-guitar.pdf)
9. [Sound On Sound – Synthesizing Plucked Strings](https://www.soundonsound.com/techniques/synthesizing-plucked-strings)
10. [Mohamad, Dixon & Harte (2017), 픽업·튕김 위치 추정](https://webspace.eecs.qmul.ac.uk/s.e.dixon/pub/2017/MohamadDixonHarte-JASA2017.pdf)
11. [Stereophile – 베이스 최저음 E의 배음 측정](https://www.stereophile.com/content/editors-choice-istereophileis-sampler-test-cd-tracks-1-2)
12. [TalkBass – P-베이스 개방 E 스펙트럼](https://www.talkbass.com/threads/about-frequency-range.229193/)
13. [Woodhouse, plus.maths.org – 활로 켠 현의 물리](https://plus.maths.org/old-files/issue31/features/woodhouse/2pdf/index.html/op.pdf)
14. [Why You Hear What You Hear – 바이올린](https://www.whyyouhearwhatyouhear.com/violin.html)
15. [UNSW, McLennan – 바이올린 몸통 모드](https://newt.phys.unsw.edu.au/music/people/mclennan_monopole.html)
16. [Jansson, Barczewski & Kabala (2016), On the violin – 브리지 힐](https://yadda.icm.edu.pl/baztech/element/bwmeta1.element.baztech-fa6c7e91-1960-4c16-9b65-40ac992d8a38/c/Jansson_Barczewski_Kabala__On_the_violin_27_2016.pdf)
17. [Macquarie University – Source-Filter Theory](https://www.mq.edu.au/faculty-of-medicine-health-and-human-sciences/departments-and-schools/department-of-linguistics/our-research/phonetics-and-phonology/speech/acoustics/acoustic-theory-of-speech-production/source-filter-theory)
18. [splab.net – Source-filter Theory (−12 / +6 / −6 dB/oct)](https://splab.net/apd/g500)
19. [Praat – Create formant table (Peterson & Barney 1952)](https://www.fon.hum.uva.nl/praat/manual/Create_formant_table__Peterson___Barney_1952_.html)
20. [The role of f0 and formant frequencies in distinguishing the voices of men and women](https://www.researchgate.net/publication/26291295_The_role_of_f0_and_formant_frequencies_in_distinguishing_the_voices_of_men_and_women)
21. [Kent & Vorperian (2018), Static Measurements of Vowel Formant Frequencies and Bandwidths: A Review](https://pmc.ncbi.nlm.nih.gov/articles/PMC6002811/)
22. [Hillenbrand et al. (1995), Acoustic characteristics of American English vowels](https://www.citedrive.com/en/discovery/acoustic-characteristics-of-american-english-vowels)
23. [Yang (1992), An acoustical study of Korean monophthongs produced by male and female speakers](https://pubs.aip.org/asa/jasa/article-abstract/91/4/2280/663187/An-acoustical-study-of-Korean-monophthongs?redirectedFrom=fulltext)
24. [Yang (1996), A comparative study of American English and Korean vowels produced by male and female speakers](https://www.sciencedirect.com/science/article/abs/pii/S0095447096900133)
25. [Acoustics Today (2016) – The Acoustics of Brass Musical Instruments](https://acousticstoday.org/wp-content/uploads/2016/12/Brass.pdf)
26. [Essentia – Odd-to-even harmonic energy ratio (클라리넷 vs 트럼펫)](https://essentia.upf.edu/reference/std_OddToEvenHarmonicEnergyRatio.html)
27. [HyperPhysics – Playing Ranges of Instruments (Backus의 악기 포먼트 표)](https://hyperphysics.gsu.edu/hbase/Music/orchins.html)
28. [Fletcher & Tarnopolsky (1999), Blowing pressure, power, and spectrum in trumpet playing](https://www.phys.unsw.edu.au/music/people/publications/Fletcheretal1999.pdf)
29. [Beauchamp et al. – Perceptual effects of simplifying musical instrument sound time-frequency representations](https://sonicfield.org/library/perceptual-effects-of-simplifying-musical-instrument-sound-time-frequency-repres)
30. [US Patent 4300434 – 트럼펫 세기에 따른 스펙트럼 변화(Risset 분석 인용)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/4300434)
31. [Sound On Sound – Synthesizing Simple Flutes (리코더 스펙트럼)](https://www.soundonsound.com/techniques/synthesizing-simple-flutes)
32. [Philippe Bolton, Recorder Maker – How Recorders Work](https://www.flute-a-bec.com/acoustiquegb.html)
33. [UNSW – Flute acoustics](https://newt.phys.unsw.edu.au/jw/fluteacoustics.html)
34. [Giordano & Saenger (2023), 리코더 음의 스펙트럼 성분](https://par.nsf.gov/biblio/10477214)
35. [Physics and musical instruments (European Journal of Physics) – 리코더의 닫힌 관형 스펙트럼](https://www.rose-hulman.edu/~moloney/Acoustics/ej1109%20physics%20and%20musical%20instruments.pdf)
36. [Forum Acusticum 2023 – 역사적 알토 리코더의 스펙트럼 유형](https://dael.euracoustics.org/confs/fa2023/data/articles/000327.pdf)
37. [University of Rochester PHY103 – Bars and bells (자유 막대 모드 비)](https://www.pas.rochester.edu/~sybenzvi/courses/phy103/2016f/phy103_bars_and_bells.pdf)
38. [Stanford CCRMA – Percussion (실로폰·마림바 조율)](https://ccrma.stanford.edu/courses/150-spring-2003/percussion.html)
39. [HyperPhysics – Xylophone and Marimba](https://hyperphysics.gsu.edu/hbase/Music/xylo.html)
40. [UBC PHYS341 (2021) Project 20 – 실로폰 공명관과 말렛](https://wiki.ubc.ca/Courses:PHYS341/2021/Project20)
41. [Grinnell College Musical Instrument Collection – Xylophone](https://omeka-s.grinnell.edu/s/MusicalInstruments/item/972)
42. [US Patent 4411187 – Composite marimba bars (실로폰 감쇠 시간)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/4411187)
