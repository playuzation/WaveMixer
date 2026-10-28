# 실제에 가까운 소리를 만들기 위한 조사

이 문서는 WaveMixer의 소리에 대한 두 가지 질문을 조사한 결과입니다.

1. 악기 소리가 실제 악기가 아니라 '조잡한 가상악기'처럼 들리는 이유와, 실제에 가깝게 만드는 방법
2. 목소리 발음이 뭉쳐 들리는 이유와, "더 많은 파형을 섞으면 해결되는가"

문서 읽는 법:

- 조사일은 2026-10-27입니다.
- 출처 원문을 직접 열지 못하고 웹 검색 결과(초록·요약·2차 인용)로 정리했습니다. 핵심 수치는 원문과 대조가 필요합니다.
- *(진단)* 은 현재 WaveMixer 코드로 직접 계산한 값, *(추론)* 은 출처를 바탕으로 한 해석입니다.
- 이 문서는 조사만 담았고, 코드는 바꾸지 않았습니다. 적용 방안은 [WaveMixer에 적용한다면](#wavemixer에-적용한다면)에 제안으로만 정리했습니다.

## 짧은 답

**파형을 더 많이 섞는 것만으로는 해결되지 않습니다.** 근거는 다음과 같습니다.

- 말소리를 사인파로 다시 만드는 McAulay–Quatieri 모델은 사인파마다 진폭·주파수·위상을 짧은 구간(프레임)마다 새로 정하고, 이웃 프레임끼리 이어 줍니다. 그렇게 만든 소리는 원음과 "거의 구별되지 않았습니다" [1]. 사인파 수보다 **시간에 따라 바뀌는 것**이 핵심이라는 뜻입니다.
- 거꾸로 포먼트를 따라 움직이는 사인파 **세 개**만으로도 말의 내용이 전달됩니다(사인파 음성, Remez 1981) [2].
- 악기 연구도 같습니다.
  - 어택(소리가 시작되는 순간)이 악기를 알아보는 데 결정적입니다 [3].
  - 모든 배음에 같은 크기 변화를 씌우는 단순화는 원음과 쉽게 구별됩니다 [4].

그래서 무엇을 늘려야 하는지는 두 가지로 나뉩니다.

- **늘려야 효과가 있는 것:** 잡음 자음의 성분 밀도, 진폭을 나타내는 정밀도
- **늘려도 안 되는 것:** 시간 변화(어택·감쇠·포먼트 이동)와 미세한 흔들림. 이것들은 아예 새로 만들어야 합니다.

## 지금 소리의 진단

현재 코드로 계산한 값입니다 *(진단)*.

| 항목 | 지금 WaveMixer | 실제 소리 |
| --- | --- | --- |
| 시간 변화 | 모든 성분이 같은 크기로 계속 울림. 악기는 10 ms 동안 커지고 40 ms 동안 줄어들 뿐 감쇠가 없음 | 어택에서 배음이 따로따로 생겨나고, 튕기거나 치는 악기는 높은 배음부터 빨리 줄어듦 |
| 진폭 표현 | 같은 주파수를 1~6번 넣는 방식이라 세기 차이가 최대 15.6 dB, 단계는 정수 개수 | 배음 세기 차이가 수십 dB |
| 잡음 | ㅅ은 사인파 28개(866~6447 Hz, 평균 간격 207 Hz). 최대공약수 1 Hz라 「샘플」 탭에서 계속 재생하면 1초마다 같은 모양이 반복됨 | 연속된 스펙트럼의 무작위 잡음 |
| 위상 | 모든 코사인이 위상 0에서 시작해 뾰족한 펄스 모양 파형 | 위상이 제각각이고 시간에 따라 흔들림 |
| 높이 | 음절마다 한 높이로 고정되어 계단처럼 바뀜(예: 안녕하세요 = 195·232·204·178·210 Hz). 떨림 없음 | 연속적인 억양 곡선과 미세한 떨림(jitter, 비브라토) |
| 구간 전환 | 정지된 스펙트럼 두 개를 선형으로 겹쳐 바꿈(4~129 ms). 포먼트 봉우리가 움직이지 않음 | 포먼트 주파수가 연속으로 움직임 |
| 높은 목소리 | 여성 '아'의 F1(945 Hz)이 4배음(868 Hz)과 5배음(1085 Hz) 사이에 끼어, 포먼트 봉우리가 배음에 정확히 실리지 않음 | 같은 문제가 실제 목소리에도 있음 [5] |
| 공간 | 잔향 없이 메마른 소리 | 몸통 공명과 방의 잔향 |

진폭 압축을 여성 '아'로 계산해 보면 다음과 같습니다 *(진단)*.

| 배음 | 주파수 | 음원-필터 모델 값 | 개수로 표현된 값 |
| --- | --- | --- | --- |
| 1 | 217 Hz | −6.7 dB | −1.6 dB |
| 4 (F1 근처) | 868 Hz | 0 dB | 0 dB |
| 8 | 1736 Hz | −14.5 dB | −3.5 dB |
| 10 | 2170 Hz | −29.8 dB | −15.6 dB |
| 12 | 2604 Hz | −33.8 dB | 없음 |
| 13 (F3 근처) | 2821 Hz | −31.1 dB | −15.6 dB |
| 전체 범위 | | 65.5 dB | 15.6 dB |

- 약한 배음이 실제보다 훨씬 크게 들어가서 소리가 '윙윙'(buzzy) 밝아집니다.
- 악기 샘플도 배음 세기 차이가 6~24 dB 안에 갇혀 있습니다(실로폰 6 dB, 기타 24.1 dB).

## 악기를 실제처럼 들리게 하는 요인

근거가 강한 순서입니다.

### 1. 어택과 시간에 따라 바뀌는 스펙트럼

- 지속음 악기는 어택 구간이 정상 구간이나 감쇠 구간보다 악기 식별에 더 중요했습니다. 타악기는 덜 의존했습니다(Clark 외 1963) [3].
- 어택을 포함하면 식별이 크게 정확해졌다는 보고(Saldanha & Corso 1964)가 블로그에 인용되어 있으나 원문을 확인하지 못했습니다 [6]. 어택을 지우거나 바꾸면 악기를 못 알아볼 수 있다는 시연 자료도 있습니다 [7].
- 음색 공간 연구에서 반복해 나오는 축은 다음과 같습니다.
  - Grey 1977: 스펙트럼 에너지 분포, 배음들이 함께 시작·끝나는 정도, 어택의 약한 고주파 에너지 [8]
  - McAdams 외 1995: 어택 시간(log rise time), 스펙트럼 무게중심, 스펙트럼 변화량(flux) [9]
- Risset의 트럼펫 분석에 따르면 소리가 커질수록 에너지가 더 높은 배음까지 퍼지고, 어택 초반에는 낮은 배음만 뚜렷합니다 [10]. Chowning의 FM 금관 합성이 변조 지수를 음량에 비례시키는 이유도 이것입니다 [11].
- 배음마다 크기·주파수 변화를 직선 몇 개로 근사해도 원음에 꽤 가깝게 들렸습니다(Grey & Moorer 1977). 그래서 시간 변화를 넣을 때 꼭 정밀할 필요는 없습니다 [12].
- 반대로 **모든 배음에 같은 크기 변화를 씌우는** 단순화는 원음과 아주 잘 구별되었습니다(McAdams, Beauchamp & Meneguzzi 1999) [4]. 지금 WaveMixer 방식이 바로 이 경우입니다.
- 합성음을 원음만큼 알아본 비율은 오보에 0.97에서 트롬본 0.62까지였습니다. 오보에·클라리넷·트럼펫 등은 스펙트럼 모양이, 플루트·트롬본·호른은 시간 변화가 그만큼 또는 더 중요했습니다(Strong & Clark 1967) [13].

### 2. 배음마다 다른 감쇠

- 튕기거나 치는 현은 높은 배음이 더 빨리 줄어듭니다. 예로 1배음은 약 13 dB/s, 2배음은 약 24 dB/s로 줄어든 사례가 있습니다 [14].
- 피아노는 처음 약 8 dB/s로 빨리 줄다가(prompt sound), 그 1/4 이하 속도로 천천히 줄어듭니다(aftersound). 한 음에 여러 줄이 함께 울리며 서로 결합하기 때문입니다 [15]. 어긋난 줄을 그냥 더하면 맥놀이는 생기지만 두 단계 감쇠는 생기지 않습니다 [16].

### 3. 세기에 따라 바뀌는 밝기

- 세게 연주할수록 높은 배음이 커집니다(트럼펫 [10], 피아노 해머).
- 샘플 하나를 음량만 바꿔 쓰면 사실적이지 않아서, 샘플러는 세기별 샘플(velocity layer)을 따로 둡니다 [17].

### 4. 소리와 맞물린 잡음

- Spectral Modeling Synthesis(Serra & Smith 1990)는 소리를 「시간에 따라 바뀌는 사인파들」과 「시간에 따라 바뀌는 필터를 거친 잡음」으로 나눠 만듭니다 [18].
- 활로 켠 소리에 일정한 잡음을 그냥 더하면 두 소리로 분리되어 들렸습니다. 잡음도 음의 주기에 맞춰 맥동해야 합니다 [19].
- 플루트의 잡음은 맥동하고 고음 쪽에 실립니다 [20]. 관악기는 시작할 때 잡음 비중이 크고 지속 구간에서 줄어듭니다 [21]. 피아노는 해머가 현을 칠 때의 잡음이 가장 두드러집니다 [22].

### 5. 비조화성과 미세하게 어긋난 음

- Fletcher·Blackham·Stratton(1962)은 발진기 100개짜리 합성기로 피아노 소리를 만들어 청취자 8명에게 들려주었습니다 [23].
  - 가온 C 아래의 음은 배음이 비조화적이어야 피아노답게 들렸습니다.
  - 어택은 0.01초보다 짧아야 했습니다.
  - 배음 세기가 100 Hz당 2 dB씩 줄어들 때 가장 좋았습니다.
- 피아노의 한 음에 걸린 여러 줄은 일부러 몇 센트(cent)씩 어긋나게 조율합니다 [24].
- 합창에서는 높이가 표준편차 0~5센트로 흩어진 소리를 선호했고 약 14센트까지 받아들였습니다 [25].

### 6. 비브라토와 미세한 흔들림

- 비브라토는 초당 4~10번이고 평균 5~7번입니다. 전문 바이올린 연주자는 6.63 Hz, 폭 63센트로 측정되었고, 성악은 위아래 폭 50~150센트입니다 [26][27].
- 배음들이 **함께** 흔들려야 한 소리로 묶여 들립니다. 한 배음만 따로 흔들리면 별개의 소리로 들립니다 [28].
- 플루트 소리에서 흔들림을 위상 무작위화로 만들면 원음과 구별되지 않았지만, 필터 잡음으로 만들면 뚜렷이 나빴습니다 [29].

### 7. 진폭을 나타내는 정밀도

- 소리 크기 변화의 최소 감지량(JND)은 약 1 dB 이하이고, 큰 소리에서는 0.25~0.4 dB입니다 [30].
- 배음 하나의 세기 변화는 낮은 배음에서 잘 느끼고 높은 배음에서는 덜 느낍니다 [31][32].
- *(추론)* 같은 주파수 개수로 진폭을 나타내면 낮은 배음에서도 수 dB씩 어긋나고(1개 차이가 6개 중에서는 약 1.6 dB, 2개 중에서는 6 dB), 전체 범위가 15.6 dB에 갇힙니다. 감지 한계보다 큰 오차입니다.

### 8. 몸통과 공간

- 악기 몸통의 공명은 여러 개의 공진으로 모델링합니다. 바이올린 몸통 모델의 한 예는 약 3.2 kHz까지 13개를 씁니다 [33]. 몸통 응답을 처음 들뜸 신호에 미리 합쳐 두는 방법(commuted synthesis)도 있습니다 [34].
- "잔향이 없으면 인공적으로 들린다"를 직접 보인 연구는 찾지 못했습니다. 잔향의 양에 따라 감정 평가가 크게 달라졌다는 연구는 있습니다 [35].

### 9. 위상 (영향 가장 작음)

- 배음 위상을 바꿔서 생기는 음색 차이는 스펙트럼 기울기를 2 dB/oct 바꾸는 것보다 작았습니다(Plomp & Steeneken 1969) [36].
- 다만 기본 주파수가 낮을 때(예: 125 Hz)는 위상 차이가 들립니다 [37].

### 합성 방식 비교

| 방식 | 원리 | 사실감과 비용 |
| --- | --- | --- |
| 가산 합성 (시간 변화 포함) | 배음마다 크기·주파수 변화를 따로 줌 | 분석 데이터가 있으면 원음에 가까움 [12]. 배음 수만큼 계산 |
| FM | 사인파로 사인파의 주파수를 흔듦 | 샘플당 연산 몇 번이면 됨. 금관 같은 밝기 변화를 쉽게 흉내 냄 [11][38] |
| 샘플링·웨이브테이블 | 녹음한 소리를 재생 | 가장 사실적이지만 세기별 샘플이 필요해 메모리를 많이 씀 [17] |
| Karplus-Strong | 잡음을 지연선에 넣고 저역 필터로 되먹임 | 높은 배음이 빨리 줄어드는 현 소리가 저절로 나옴 [39] |
| 디지털 도파관 | 관·현의 파동 전파를 지연선으로 모델링 | 연주 표현이 자연스러우나 조정이 어려움. Yamaha VL1(1994) [40] |
| 모달 합성 | 감쇠하는 공진기 여러 개 | 실로폰·종처럼 비조화적인 타악기에 적합 [41] |

## 목소리를 또렷하게 하는 요인

근거가 강한 순서입니다.

### 1. 움직이는 포먼트 (가장 중요)

- F2(·F3)가 자음 쪽으로 움직이는 모양(전이)이 조음 위치(ㅂ/ㄷ/ㄱ)의 단서입니다. locus는 /d/ 약 1800 Hz, /b/ 약 720 Hz입니다 [42].
- 자연스러운 파열음+모음에서 조음 위치 단서는 첫 20~40 ms에 들어 있습니다 [43].
- 전이 길이만으로도 /b/와 /w/, /g/와 /j/가 갈렸습니다(10~60 ms에서 실험) [44]. 전이 길이가 진폭 상승 시간보다 "훨씬 중요한 요인"이었다는 연구도 있습니다 [45].
- **두 정지 스펙트럼을 선형으로 겹쳐 바꾸면** 부드럽지만 "부자연스러운 모양의 포먼트 궤적"이 생깁니다 [46]. 스펙트럼을 그냥 보간하면 포먼트 구조가 흐려지므로, 먼저 정렬한 뒤 보간해야 그럴듯한 포먼트 궤적이 나옵니다 [47].
  - *(추론)* 지금 WaveMixer는 이 '겹쳐 바꾸기' 방식이어서, 두 모음이 동시에 들리는 순간이 생기고 포먼트가 실제로 움직이지 않습니다. 발음이 뭉쳐 들리는 가장 큰 원인으로 보입니다.
- 모음도 정지 구간이 아니라 포먼트 움직임으로 알아듣습니다. 모음 가운데를 지운 음절이 지운 가운데 부분보다 더 잘 인식되었습니다 [48].
- 한국어 반음절 합성기에 전이 규칙을 추가하자 자연성 평가(MOS)가 올랐다는 보고도 있습니다 [49].

### 2. 진짜 잡음

- Klatt 합성기(1980)는 마찰음을 위한 별도 경로와, 성대 울림·마찰·숨소리 각각의 세기 값을 두고, 모든 값을 5 ms마다 바꿉니다 [50][51].
- SMS도 사인파로 표현되지 않는 나머지를 시간에 따라 바뀌는 필터를 거친 백색 잡음으로 만듭니다 [18].
- 사인파에 무작위 위상 흔들림을 주면 점점 좁은 대역의 잡음처럼 됩니다 [52].
- 잡음처럼 들리는 데 필요한 사인파 수는 임계 대역마다 거의 일정하고, 높은 주파수에서는 더 많이 필요하다는 2차 인용이 있습니다 [53].
- 사인파만으로 만든 말은 처음 듣는 사람에게 "새소리, 휘파람, 컴퓨터 삑삑 소리"처럼 들립니다 [54].
  - 사인파 음성의 문장 받아쓰기는 7음절 중 평균 2.8음절이었습니다 [55].
  - 사인파 모음 인식률은 55 %로, 원음 약 95 %보다 낮았습니다 [56].
- 파열음의 터짐은 약 20 ms까지 하나의 정지 스펙트럼처럼 다룰 수 있고, 터짐의 시작이 조음 위치의 믿을 만한 단서입니다 [57].
- *(추론)* 지금 ㅅ·ㅊ 같은 자음은 사인파 수십 개라서 잡음보다는 '쉭 하는 화음'에 가깝고, 한국어 예사/거센소리 구별에 중요한 뒤 모음 시작 높이[58]만 일부 반영되어 있습니다.

### 3. 성대 음원

- 성대 음원을 LF 모델로 만들면 단순 펄스열보다 자연스러웠고, 펄스열은 "윙윙거린다(buzzy)"고 평가되었습니다 [59].
- 배음 위상 관계가 고정되면 "금속성의 윙윙거림"이 들립니다 [60].
- 숨소리 잡음은 숨 섞인 목소리의 가장 중요한 지각 단서입니다(Klatt & Klatt 1990) [61].

### 4. 떨림과 높이 변화

- 합성 모음 80개 중 사람 목소리로 평가된 27개를 보면, 15개는 높이 떨림(jitter)과 세기 떨림(shimmer)이 함께 있었고, 10개는 높이 떨림만, 2개는 둘 다 없었고, 세기 떨림만 있는 것은 0개였습니다 [62].
- 정상 범위로 흔히 인용되는 값은 jitter 1.04 % 이하, shimmer 3.81 % 이하입니다 [63]. 한국인 남성의 jitter는 0.47~0.66 %로 측정되었습니다 [64].
- Klatt 합성기 구현은 느리게 변하는 사인파 세 개로 높이를 미세하게 흔듭니다(flutter) [65].
- 높이 변화가 너무 적으면 기계적으로 들립니다 [66].
  - 높이 변화를 키우면 자연성은 올라가지만 알아듣기는 조금 떨어질 수 있습니다 [67].
  - 높이를 평평하게 만들면 다른 사람 목소리가 섞일 때 알아듣기가 더 나빠졌습니다 [68].

### 5. 포먼트 대역폭과 높은 포먼트

- 대역폭과 포먼트 세기의 정확한 값은 모음 음질에 "결정적이지 않다"고 했습니다(Fant) [69].
- F3을 150 Hz 옮기면 80 %가 알아챘습니다 [70]. *(추론)* 지금 F3·F4를 성도 길이로 추정해 넣은 부분은 개선 여지가 있습니다.
- 높은 목소리는 배음 간격이 포먼트 간격에 가까워져, 성도 특성이 드문드문 드러납니다 [5].

### 6. 길이와 또박또박 말하기

- 또박또박 말하기(clear speech)는 보통 말보다 알아듣기가 약 15점 높았습니다. 마찰음·이중모음이 길고, 쉼이 많고, 높이 범위가 넓었습니다 [71].
- 빠른 포먼트 합성음은 빠른 자연음보다 알아듣기 어렵습니다 [72].

### 7. 합성 방식별 성능

| 방식 | 결과 |
| --- | --- |
| 포먼트 합성 (DECtalk) | Modified Rhyme Test 오류 3.25 % (자연음 0.53 %). 첫 자음 1.56 %, 끝 자음 4.94 % [73] |
| 포먼트 합성 (MITalk) | 같은 시험 오류 약 6.9 % [74] |
| 연결 합성 / 통계 합성 / WaveNet / 자연음 | 미국 영어 자연성(MOS): 3.86 / 3.67 / 4.21 / 4.55 [75] |
| Blizzard Challenge | 통계(파라메트릭) 방식이 가장 잘 들리고, 단위 선택 방식이 가장 자연스러움. 녹음과 같은 자연성은 없었음 [76] |

포먼트 합성으로도 알아듣기 쉬운 말은 만들 수 있지만(오류 3 % 수준), 자연스러움은 녹음 기반·신경망 방식에 못 미칩니다.

## "더 많은 파형"에 대한 정리

| 늘리면 좋아지는 것 | 늘려도 안 되는 것 (새로 필요한 것) |
| --- | --- |
| 잡음 자음의 성분 수: 임계 대역마다 충분히 촘촘해야 함 [53]. 또는 진짜 잡음 생성 | 포먼트가 움직이는 전이 [46][44] |
| 진폭 정밀도: 개수 대신 진폭 값으로 | 악기의 어택과 배음별 감쇠 [3][4] |
| 높은 배음·높은 포먼트 | 높이·세기의 미세한 흔들림 [62] |

McAulay–Quatieri 모델처럼 **사인파 수가 같아도 짧은 구간마다 값을 바꾸면** 원음에 가까워집니다 [1]. 사인파 세 개짜리 사인파 음성도 움직이기만 하면 말이 전달됩니다 [2].

## WaveMixer에 적용한다면

효과가 클 것으로 보이는 순서입니다 *(추론)*. 1~7번을 모두 적용했습니다.

- **1번 적용 내용:**
  - 「음절 만들기」·「문장 말하기」의 모음·활음·비음·ㄹ·받침을 포먼트 F1~F4·높이·세기의 키프레임으로 바꿔 5 ms마다 이어서 움직이게 했습니다.
  - 자음 뒤 모음은 조음 위치 쪽에서 40 ms 동안 옮겨 옵니다.
  - 이 구간의 배음 진폭은 실제 값이라, 위 진단의 진폭 압축도 이 두 탭에서는 사라졌습니다.
  - 자세한 값은 [korean-speech-sounds.md](korean-speech-sounds.md)의 「음절로 합성한 방법」을 참고하세요.
- **2번 적용 내용:**
  - 「음절 만들기」·「문장 말하기」의 터짐·마찰·숨소리를 코사인파 묶음 대신 무작위 잡음을 대역 필터로 걸러 만들게 했습니다.
  - 파열음·파찰음의 터짐은 1 ms 만에 시작하고, 숨소리와 ㅎ은 뒤 모음의 F1~F4 공진기를 지나게 했습니다.
  - 잡음 구간의 대역 안 스펙트럼 평탄도(1에 가까울수록 잡음다움)가 ㅅ 0.007 → 0.48, ㅊ 0.061 → 0.51로 바뀌었습니다. ㅎ은 0.000 → 0.13으로, 뒤 모음 포먼트 모양이 남습니다.
  - 「샘플」 탭의 잡음 자음은 코사인파 목록 그대로입니다.
- **3번 적용 내용:**
  - 「파형 만들기」의 파동마다 진폭(배율 0.001~10, 비우면 1)을 두고, 주파수 옆 칸에서 입력하게 했습니다. 목록에는 `0.5·cos(2π·880·t)`처럼 배율과, 가장 큰 진폭 대비 dB를 함께 보여줍니다.
  - 모음·유성 자음 샘플은 음원-필터 모델의 실제 배음 진폭(가장 강한 배음 = 1, −60 dB 미만 제외)을 씁니다. 세기 범위가 15.6 dB에서 약 54~60 dB로 넓어졌습니다(여성 '아' 54.3 dB).
  - 악기 샘플 중 피아노·바이올린은 1/n, 기타는 sin(nπ/5)/n² 식의 값을 그대로 쓰고, 나머지는 근거 자료에 수치가 없어 기존 비율을 진폭으로 옮겼습니다.
  - 잡음 자음 샘플은 진폭 1인 코사인파 묶음 그대로입니다.
- **4번 적용 내용:**
  - 「음계로 듣기」에 **울림**을 고르는 줄을 두었습니다. 목록의 어떤 파형이든 고른 울림대로 배음마다 다르게 커지고 줄어듭니다.
  - 악기 샘플을 고르면 그 악기의 울림이 함께 골라집니다(피아노 타격, 기타·베이스 튕김, 바이올린 활, 트럼펫·리코더 관, 실로폰 막대, 여성 '아' 지속).
  - 「합성음 재생」과 합성 파형 그림은 그대로 순수한 코사인 합이라, 위 고려할 점처럼 「코사인파 목록 = 소리」 관계를 지켰습니다.
  - 울림마다 쓴 값은 아래와 같습니다. n은 배음 번호, 감쇠는 C4(262 Hz) 기준입니다.

    | 울림 | 시작 | 줄어듦 | 근거 |
    | --- | --- | --- | --- |
    | 지속 | 10 ms, 모든 배음 같이 | 없음 | 지금까지의 방식 |
    | 튕김 | 3 ms *(추정)* | 1배음 13 dB/s, 2배음 24 dB/s를 n의 거듭제곱(n^0.88)으로 이음. 10배음 약 100 dB/s | [14] |
    | 타격 | 5 ms | 두 단계: 처음 1배음 8 dB/s, 남은 소리(세기의 20 % *(추정)*)는 4배 느리게. 배음별 빠르기는 튕김과 같은 비율 *(추정)* | 어택 10 ms 미만 [23], 두 단계 감쇠 [15] |
    | 막대 | 1 ms *(추정)* | 주파수 f의 성분이 60 dB 줄어드는 시간 = 1초 × (f/349 Hz)^−1.57. 349 Hz(F4) 1초, 4186 Hz(C8) 0.02초 | 저음 약 1초~고음 약 1/50초 [79][80], 음역 F4~C8 *(추정)* |
    | 활 | 40 ms, 배음 하나마다 10 %씩 늦게 *(추정)* | 없음 | 스타카토 바이올린 어택 30~50 ms [77] |
    | 관 | 20 ms, 배음 하나마다 10 %씩 늦게 *(추정)* | 없음 | 리코더 어택 10~30 ms [78], 트럼펫은 어택에서 낮은 배음이 먼저 [10] |

  - 브라우저에서 C4를 2초 재생하며 실효값을 잰 결과, 1.5초 값 ÷ 60 ms 값이 지속 1.00, 튕김 0.11, 타격 0.34, 막대 0.002였습니다. 활은 5 ms에 0.010, 400 ms에 0.113으로 천천히 커졌습니다.
  - 배음마다 다른 크기 변화를 주었지만, 실제 악기의 분석 데이터가 아니라 위 규칙으로 만든 근사입니다. 세기에 따른 밝기 변화와 소리와 맞물린 잡음(위 「악기를 실제처럼 들리게 하는 요인」 3·4)은 넣지 않았습니다.
- **5번 적용 내용:**
  - **목소리 높이 떨림** (「음절 만들기」·「문장 말하기」)
    - Klatt 합성기 구현처럼 느린 사인파 세 개(12.7·7.1·4.7 Hz)를 더해 높이를 흔듭니다 [65].
    - 크기는 실효값 0.5 %입니다. 한국인 남성 jitter 0.47~0.66 %[64]를 크기로 빌려 썼습니다 *(추정)*. jitter는 주기마다의 떨림이고, 이 흔들림은 느린 변화라서 같은 양은 아닙니다.
    - 200 Hz로 재 보니 실효값 0.48 %, 최대 1.17 %였습니다.
  - **연속 억양 곡선** (「문장 말하기」)
    - 음절마다 높이를 평평하게 두지 않습니다. 억양구(쉼 사이) 안에서 음절 모음 가운데의 높이 목표점을 직선으로 잇습니다.
    - 성조를 목표점으로 두고 그 사이를 이어 높이 곡선을 만드는 억양 모델을 따랐습니다 [81]. 목표점의 높이는 그대로 `speech/prosody.js`의 강세구 성조입니다.
    - 높이가 평평한 프레임 비율이 약 84 %에서 4~7 %로 줄었습니다.
  - **비브라토** (「음계로 듣기」의 「활」)
    - 1초에 6.63번, ±31.5센트로 모든 배음의 높이를 함께 흔듭니다.
    - 전문 바이올린 연주자 측정값(6.63 Hz, 폭 63센트)[26]에서, 폭은 위아래를 합한 값으로 보았습니다 *(추정)*.
    - 배음이 함께 흔들려야 한 소리로 들리므로[28] 하나의 흔들림으로 모든 오실레이터의 `detune`을 움직입니다.
    - 브라우저에서 단일 파동으로 재 보니 약 ±28센트였습니다(분석 창 평균으로 작게 잡힘).
  - 세기 떨림(shimmer)과, 「활」 밖의 울림·합성음 재생의 흔들림은 넣지 않았습니다.
- **6번 적용 내용:**
  - **피아노 비조화성과 어긋난 줄** (「음계로 듣기」의 「타격」)
    - n번째 부분음을 n·f·√(1 + B·n²)로 조금씩 높입니다. B는 중음역 값 10⁻⁴를 썼습니다(위 [1]은 [instrument-harmonics.md](instrument-harmonics.md)의 출처). C4에서 10배음이 +8.6센트입니다.
    - 한 음을 −1·0·+1센트 어긋난 줄 세 개로 냅니다 *(추정)*. C4에서 바깥 두 줄 차이는 약 0.3 Hz입니다. Weinreich는 이보다 작으면 맥놀이 없이 '맥놀이 영점' 하나만 생긴다고 했습니다 [82].
    - 줄이 서로 조금씩 상쇄되어, 브라우저에서 잰 1.5초 값 ÷ 60 ms 값이 0.34에서 0.15로 더 줄었습니다.
    - 줄 사이의 결합(두 단계 감쇠를 만드는 원인)은 계산하지 않고, 4번의 두 단계 감쇠를 그대로 씁니다.
  - **성대 음원 모양** (「음절 만들기」·「문장 말하기」)
    - 배음 세기(1/n × 포먼트)는 그대로 둡니다. 위상만 Rosenberg 성대 펄스의 미분(열림 33 %, 닫힘 10 %) [83]과 성도 공명·반공명의 위상을 따릅니다.
    - 지금까지는 위상이 모두 0이어서 뾰족한 펄스열 모양이었습니다 [60]. 바꾼 뒤 모음 '아'의 파고율(최대 ÷ 실효값)이 여성 3.78 → 2.16, 남성 4.75 → 2.54로 낮아졌습니다.
    - 최대 진폭을 1로 맞추므로 같은 재생 세기에서 말소리가 전보다 커집니다.
    - LF 모델[59] 대신 매개변수가 적은 Rosenberg 모델을 썼고, 세기 기울기는 바꾸지 않았습니다.
  - **숨소리 섞기** (「음절 만들기」·「문장 말하기」)
    - 성대가 울리는 동안 백색 잡음을 그 순간의 포먼트(F1~F4) 공명기에 통과시켜 섞습니다[61]. 대역폭은 숨소리 구간과 같은 300·200·250·300 Hz입니다.
    - 세기는 목소리 실효값의 0.1(HNR 20 dB)입니다 *(추정)*. 정상 목소리의 HNR은 측정 방법에 따라 약 10~26 dB로 보고됩니다 [84].
    - 성문이 닫힌 동안(펄스의 열림+닫힘 43 % 밖)은 절반으로 줄입니다 *(추정)*.
    - 모음 '아'로 잰 HNR은 여성 19.6 dB, 남성 19.7 dB였습니다.
  - 음절·문장 렌더 시간이 늘었습니다. 중앙값 기준으로 음절은 약 10 → 25 ms, 문장은 약 23 → 72 ms입니다.
- **7번 적용 내용:**
  - 머리글에 **잔향** 스위치를 두었습니다(기본 켬). 「음계로 듣기」·「음절 만들기」·「문장 말하기」 재생에만 걸고, 「합성음 재생」은 순수한 코사인 합으로 둡니다.
  - 잔향은 Web Audio의 합성곱(ConvolverNode)으로 겁니다. 임펄스 응답은 지수로 줄어드는 잡음이고, 좌우를 따로 만들었습니다. 줄어드는 잡음은 고유 주파수가 없고 반사 밀도가 높아 잔향 꼬리에 가깝다고 설명됩니다 [85].

    | 값 | 설정 | 근거 |
    | --- | --- | --- |
    | 잔향 시간(RT60) | 0.5초 | 교실 기준(ANSI S12.60)이 작은 교실에서 0.6초 이하. 잔향이 길면 말소리가 뭉개짐 [86] |
    | 앞 지연 | 10 ms | *(추정)* |
    | 직접음 대비 잔향 | −10 dB(D/R +10 dB) | 관련 연구가 다루는 D/R 0~20 dB 범위 안에서 또렷함 쪽 [87] *(추정)* |

  - 임펄스 응답의 에너지를 1로 맞춰 잔향 세기가 위 비율로만 정해지게 했습니다.
  - 브라우저에서 잰 결과, 음이 끝나고 150 ms 뒤 실효값이 잔향을 켜면 0.0023, 끄면 0이었습니다(재생 중 0.14).
  - 위 8번 요인처럼 "잔향이 없으면 인공적으로 들린다"를 직접 보인 연구는 찾지 못했으므로, 스위치로 끌 수 있게 두었습니다.

| 순서 | 할 일 | 기대 효과 | 바뀔 곳 |
| --- | --- | --- | --- |
| 1 (적용) | 음절·문장 합성을 '스펙트럼 겹치기'에서 **포먼트 보간**으로 바꾸기. 5~10 ms마다 포먼트(F1~F4)를 보간하고 그 시점의 배음 세기를 계산 | 발음 또렷함(가장 큼) | `samples` 합성, `synth/render.js` |
| 2 (적용) | **진짜 잡음 소스**: 무작위 잡음을 대역 필터로 걸러 마찰·터짐·숨소리를 만들고, 터짐은 짧고 급하게 | 자음 또렷함, 쉭 소리가 자연스러워짐 | `synth/noise.js`(새 모듈), `synth/render.js`, `samples` 합성 |
| 3 (적용) | **진폭 값** 도입: 같은 주파수 반복 대신 파동마다 진폭을 둠 | 윙윙거림 감소, 스펙트럼 정확도 | `state/waves`, `synth/mixer`, `audio`, `view/waveList`, 샘플 데이터 |
| 4 (적용) | **악기 시간 변화**: 배음마다 어택 시점과 감쇠율을 다르게(높은 배음은 늦게 생기고 빨리 줄어듦), 피아노·기타·실로폰은 감쇠 | 가상악기 느낌 감소 | `synth/articulation.js`(새 모듈), `audio/player.js`, `samples/instruments.js` |
| 5 (적용) | **흔들림**: 높이 떨림 약 0.5~1 %, 비브라토 5~7 Hz·수십 센트, 연속 억양 곡선 | 기계음 느낌 감소 | `synth/render.js`, `samples` 합성, `synth/articulation.js`, `audio/player.js` |
| 6 (적용) | 피아노 **비조화성**과 미세하게 어긋난 줄(몇 센트), 성대 음원 모양·숨소리 섞기 | 악기·목소리 질감 | `synth/articulation.js`, `synth/render.js`, `synth/noise.js`, `samples/spectrum.js`, `samples` 합성 |
| 7 (적용) | **잔향**: Web Audio ConvolverNode에 짧은 잔향을 걸기 | 메마른 느낌 감소 | `audio/player.js`, 머리글 스위치(`index.html`·`main.js`) |

고려할 점:

- 1·2·4·5는 「정수 주파수 코사인파 목록」이라는 지금의 「파형 만들기」 개념을 벗어납니다.
  - 「파형 만들기」 탭은 지금처럼 순수한 코사인 합으로 두고, 「음절 만들기」·「문장 말하기」와 악기 재생에만 사실적 합성을 쓰는 식으로 나누는 것이 좋겠습니다.
  - 이렇게 하면 지금 화면의 「코사인파 목록 = 소리」라는 관계는 「파형 만들기」 탭에만 남습니다.
- 녹음 샘플이나 신경망 음성 합성을 쓰면 훨씬 사실적이지만, 「파형을 더해 소리를 만든다」는 이 프로젝트의 목적과는 거리가 멉니다.

## 조사 한계

- 웹 검색 결과의 요약·초록·2차 인용만 보았고 원문을 열지 못했습니다.
  - 특히 Saldanha & Corso의 수치, Gerzso의 잡음 밀도, Remez의 받아쓰기 수치는 2차 인용입니다.
- 음악 소리의 높이 떨림(jitter)을 다룬 지각 연구는 찾지 못했습니다(말소리 연구만 확인).
- "잔향이 없으면 인공적으로 들린다"는 직접 근거는 찾지 못했습니다.
- 진폭 해상도(6 dB 단계)가 알아듣기에 주는 영향은 직접 근거가 없고 *(추론)* 입니다. Fant는 정확한 포먼트 세기가 결정적이지 않다고 했으므로[69], 목소리에서는 1·2번보다 영향이 작을 수 있습니다.

## 참고 자료

1. [McAulay & Quatieri – 음성 처리를 위한 사인파 모델 (MIT Lincoln Lab Journal)](https://archive.ll.mit.edu/publications/journal/pdf/vol01_no2/1.2.3.speechprocessing.pdf)
2. [Remez 외 (1981) 사인파 음성 논문 발표 소개 (UC Irvine)](https://faculty.sites.uci.edu/hesplab/2015/09/25/on-wed-sep-30-at-1000-am-matt-richardson-will-present-remez-et-al-1981-science-paper)
3. [Clark 외 (1963), 악기 식별과 어택 (JAES 11:45–54)](https://aes2.org/publications/elibrary-page/?id=821)
4. [McAdams, Beauchamp & Meneguzzi (1999), 악기 소리 단순화의 구별](https://hal.archives-ouvertes.fr/hal-01105567)
5. [높은 F0에서 스펙트럼 포락의 표본화 (IFA Proceedings 24)](https://www.fon.hum.uva.nl/archive/2001/Proc24Wempe.pdf)
6. [Saldanha & Corso (1964)를 인용한 글 – A theory of attacks](https://wordpress.meganlavengood.com/2016/06/20/a-theory-of-attacks/)
7. [음 포락선이 음색에 주는 영향 시연 (Stanford CCRMA)](https://ccrma.stanford.edu/%7Emalcolm/correlograms/text/54%20Effect%20Of%20Tone%20Envelope%20On%20Timbre.html)
8. [Grey (1977) 음색 공간 요약 (UPenn)](https://www.sas.upenn.edu/~aisaac/timbre_2.html)
9. [McAdams 외 (1995), 합성 음색의 지각적 차원](https://three-mode.leidenuniv.nl/pdf/m/mcadams_etal1995pr.pdf)
10. [Risset의 트럼펫 분석을 인용한 특허 (US 4018121)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/4018121)
11. [Julius O. Smith – FM 금관 합성 (Stanford CCRMA)](https://ccrma.stanford.edu/%7Ejos/sasp/FM_Brass.html)
12. [Grey & Moorer (1977), 악기 소리의 단순화 재합성](https://katalog.lib.cas.cz/KNAV/EdsRecord/edb,75077875)
13. [Strong & Clark (1967), 합성 관악기 소리의 식별 (BYU)](https://physics.byu.edu/docs/publication/2478)
14. [현의 배음별 감쇠 (Institute of Acoustics)](https://www.ioa.org.uk/system/files/proceedings/d_j_e_nunn_fat_strings.pdf)
15. [Weinreich – 피아노 현의 운동과 두 단계 감쇠 (KTH)](https://www.speech.kth.se/music/5_lectures/weinreic/motion.html)
16. [Julius O. Smith – 결합된 현 (Physical Audio Signal Processing)](https://ccrma.stanford.edu/~jos/pasp/Coupled_Strings.html)
17. [Sound On Sound – The Lost Art of Sampling, Part 6](https://www.soundonsound.com/techniques/lost-art-sampling-part-6)
18. [Serra & Smith – Spectral Modeling Synthesis (MTG)](https://mtg.upf.edu/node/251)
19. [활 소리에 잡음을 맞물리게 하는 합성 특허 (US 5157216)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/5157216)
20. [Chafe – 플루트 잡음의 맥동 (ASA)](https://auditory.org/asamtgs/asa93dnv/4aMU/4aMU3.html)
21. [관악기 시작 잡음 합성 특허 (US 5408042)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/5408042)
22. [피아노 해머 잡음 (OFAI 기술 보고서)](https://ofai.at/papers/oefai-tr-2004-02.pdf)
23. [Fletcher, Blackham & Stratton (1962), 피아노 소리의 질 (BYU)](https://physics.byu.edu/docs/publication/1504)
24. [피아노 한 음 여러 줄의 미세한 어긋남 (Bucknell 강의 자료)](https://www.eg.bucknell.edu/~dkelley/univ213/assignments/univ213hw7_sp26.pdf)
25. [합창의 음높이 흩어짐 선호 (Frontiers in Psychology, 2023)](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2023.1220904/pdf)
26. [현악기 비브라토 측정 (BYU)](https://physics.byu.edu/docs/publication/1499)
27. [VoceVista – 비브라토 이론](https://www.vocevista.com/en/doc/theory-vibrato/)
28. [Carlyon (1991), 주파수 변조의 공통성과 소리 묶임](https://web.mit.edu/9.35/www/archives/2020/auditory/papers/Carlyon1991.pdf)
29. [플루트 소리의 미세 흔들림 합성 (Acoustical Science and Technology)](https://www.jstage.jst.go.jp/article/ast/22/3/22_3_227/_article)
30. [소리 크기 변화 감지 한계 (arXiv 2307.00084)](https://arxiv.org/pdf/2307.00084)
31. [Zera & Green – 배음 하나의 세기 변화 감지 (ASA)](https://auditory.org/asamtgs/asa92nwo/1pPP/1pPP2.html)
32. [Gunawan & Sen (2008), 악기 스펙트럼 포락 감도](https://www.academia.edu/7167375/Spectral_Envelope_Sensitivity_of_Musical_Instruments)
33. [바이올린 몸통 공진 모델 (ICMC 2000)](https://ccrma.stanford.edu/~serafin/icmc00mesh.pdf)
34. [Julius O. Smith – Commuted Synthesis](https://dsprelated.com/freebooks/pasp/Commuted_Synthesis.html)
35. [잔향 시간·양이 감정 특성에 주는 영향 (2016)](https://research.uca.ac.uk/7021/1/2016%20-%20The%20Effects%20of%20Reverberation%20Time%20and%20Amount%20on%20the%20Emotional%20Characteristics.pdf.pdf)
36. [Plomp & Steeneken (1969) 위상과 음색 (auditory.org)](https://auditory.org/postings/2010/881.html)
37. [Patterson – 위상과 음색 지각](https://www.pdn.cam.ac.uk/system/files/documents/Pmusper90.pdf)
38. [Stanford CCRMA – 물리 모델링 튜토리얼 (계산량 비교)](https://ccrma.stanford.edu/software/clm/compmus/clm-tutorials/pm.html)
39. [Wikipedia – Karplus–Strong string synthesis](https://en.wikipedia.org/wiki/Karplus%E2%80%93Strong_string_synthesis)
40. [Julius O. Smith – Digital Waveguide Models](https://ccrma.stanford.edu/~jos/pasp/Digital_Waveguide_Models_I.html)
41. [McGill – 모달 합성 강의](https://caml.music.mcgill.ca/~gary/307/week10/modal.html)
42. [Coleman – 음성 지각 강의 (Delattre 외 1955 locus)](https://www.phon.ox.ac.uk/jcoleman/SpeechPerception.htm)
43. [파열음+모음의 첫 20~40 ms 조음 위치 단서 (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3515858)
44. [Ainsworth – 자음 지각의 길이 단서 (Institute of Acoustics)](https://www.ioa.org.uk/system/files/publications/WA%20AINSWORTH%20DURATIONAL%20CUES%20IN%20THE%20PERCEPTION%20OF%20CERTAIN%20CONSONANTS.pdf)
45. [Walsh & Diehl – 파열음과 활음 지각의 청각 요인](https://sonicfield.org/library/auditory-factors-in-the-perception-of-stops-and-glides)
46. [Kain (2007), 합성 단위 연결부의 선형 겹치기와 포먼트 궤적 (SSW)](https://www.isca-archive.org/ssw_2007/kain07b_ssw.pdf)
47. [Pfitzinger (2004), 스펙트럼 보간과 포먼트 궤적 (Interspeech)](https://www.isca-archive.org/interspeech_2004/pfitzinger04_interspeech.pdf)
48. [모음 인식에서 포먼트 움직임의 역할 (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC4315365)
49. [한국어 반음절 합성기의 포먼트 전이 규칙 (koreascience)](https://www.koreascience.or.kr/article/JAKO199615875838851.page?&lang=ko)
50. [Klatt (1980), Software for a cascade/parallel formant synthesizer](https://www.fon.hum.uva.nl/david/ba_shs/2009/klatt-1980.pdf)
51. [Oxford – Klatt 합성기 매개변수](https://www.phon.ox.ac.uk/synth)
52. [Macon – 사인파 위상 흔들기 (Eurospeech 1999)](https://www.isca-archive.org/eurospeech_1999/macon99_eurospeech.pdf)
53. [Gerzso (1980)를 인용한 글 – 잡음처럼 들리는 사인파 수 (auditory.org)](https://auditory.org/postings/2012/546.html)
54. [사인파 음성 소개 (Bioacoustics)](https://bioacoustics.myspecies.info/content/sine-wave-speech-cocktail-party-worth-attending)
55. [Remez (1981) 받아쓰기 결과 인용 (auditory.org)](https://auditory.org/mhonarc/2003/msg00203.html)
56. [사인파 모음 인식률 (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3135151)
57. [Bonneau – 파열음 터짐 스펙트럼 (ICSLP 1996)](https://www.isca-archive.org/icslp_1996/bonneau96_icslp.pdf)
58. [한국어 예사/거센소리의 VOT와 F0 (Interspeech 2004)](https://www.isca-archive.org/interspeech_2004/kim04c_interspeech.html)
59. [Cabral 외 (2010), LF 음원과 펄스열 비교 (SSW7)](https://www.cstr.ed.ac.uk/downloads/publications/2010/cabral_ssw7.pdf)
60. [고정 위상과 금속성 소리 (Eurospeech 1999)](https://aholab.ehu.es/ahoweb/files/publicaciones/EUROSPEECH99.pdf)
61. [Klatt & Klatt (1990), 여성·남성 목소리 음질 분석과 합성](https://www.fon.hum.uva.nl/david/ma_ssp/doc/Klatt-1990-JAS000820.pdf)
62. [합성 모음의 jitter·shimmer와 자연성 (Journal of Voice 2017)](https://observatorio.fm.usp.br/entities/publication/41448492-a962-4b0b-bc71-245c3d3173dd)
63. [음성 지표 정상 범위 표 (J Otolaryngol Head Neck Surg)](https://journalotohns.biomedcentral.com/articles/10.1186/s40463-014-0028-4/tables/2)
64. [한국인 음성 jitter 측정 (koreascience)](https://www.koreascience.or.kr/journal/OMSOBU/v9n2.page?&lang=en)
65. [Klatt 합성기 구현의 flutter (Surrey)](https://ph-vssp-www.eps.surrey.ac.uk/amma/docs/Auto/Develop/Class/StdSpeechN.KlattSynthC.html)
66. [F0 변화와 기계적인 소리 (Interspeech 2025)](https://www.isca-archive.org/interspeech_2025/bakkouche25_interspeech.pdf)
67. [Vojtech 외 (2019), F0 변화와 자연성·명료성 (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC6802860)
68. [평평한 F0와 알아듣기 (Cardiff)](https://orca.cardiff.ac.uk/id/eprint/13738/)
69. [Fant – 포먼트 대역폭과 세기 (KTH STL-QPSR 1970)](https://www.speech.kth.se/~rolf/MyKTHpapers_6/www.speech.kth.se/prod/publications/files/qpsr/1970/1970_11_2-3_019-035.pdf)
70. [F3 변화 감지 (ICA 2010)](https://mores.mt.haw-hamburg.de/paper/ICA_2010_Sydney_F3.pdf)
71. [또박또박 말하기의 특성 (USF 자료, Uchanski 1996 인용)](https://www.usf.edu/cbcs/csd/documents/clear-communication-group/asha12-handout.pdf)
72. [빠른 포먼트 합성음의 명료성 (Interspeech 2014)](https://www.cstr.ed.ac.uk/downloads/publications/2014/salb_IS14.pdf)
73. [합성 음성의 Modified Rhyme Test 결과 (PMC)](https://pmc.ncbi.nlm.nih.gov/articles/PMC3512093/)
74. [MITalk 명료성 (IEEE)](https://ieeexplore.ieee.org/document/1170888)
75. [van den Oord 외 (2016), WaveNet (arXiv 1609.03499)](https://arxiv.org/pdf/1609.03499)
76. [Blizzard Challenge 결과 분석 (arXiv 1807.10941)](https://arxiv.org/pdf/1807.10941)
77. [Guettler – 바이올린 시작 과도 시간 (Onset-transient times)](https://knutsacoustics.com/files/Onset-transient-times-Rev.2.pdf)
78. [Ernoult & Fabre (2017), 리코더 시작 과도의 시간 특성 (JASA, HAL)](https://hal.sorbonne-universite.fr/hal-01468377/document)
79. [Grinnell College Musical Instrument Collection – Xylophone](https://omeka-s.grinnell.edu/s/MusicalInstruments/item/972)
80. [US Patent 4411187 – Composite marimba bars (실로폰 감쇠 시간)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/4411187)
81. [Pierrehumbert (1983), 성조 목표점과 그 사이의 보간](https://www.phon.ox.ac.uk/jpierrehumbert/publications/Pierrehumbert_1983.pdf)
82. [Weinreich – 조금 어긋난 피아노 줄과 맥놀이 (KTH)](https://www.speech.kth.se/music/5_lectures/weinreic/mistuned.html)
83. [Rosenberg 성대 펄스의 열림·닫힘 시간을 주기의 33 %·10 %로 둔 예 (ICASSP 1997)](https://www2.spsc.tugraz.at/people/franklyn/ICASSP97/pdf/author/ic971691.pdf)
84. [정상 성인의 음성 지표(HNR) 측정 (KUMJ 2009)](https://www.nepjol.info/index.php/KUMJ/article/view/2757)
85. [US Patent 7860256 – 줄어드는 잡음으로 만드는 인공 잔향](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/7860256)
86. [Armstrong – 교실 음향 ANSI S12.60 (잔향 시간 0.6초)](https://www.armstrong.com/en-us/articles/classroom-acoustics-ansi-standard.html)
87. [Griesinger – 직접음 대 잔향 비와 거리·위치 지각 (IOA)](https://www.ioa.org.uk/system/files/proceedings/d_griesinger_the_importance_of_the_direct_to_reverberant_ratio_in_the_perception_of_distance_localisa.pdf)
