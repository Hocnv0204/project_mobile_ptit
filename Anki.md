![[Pasted image 20260423163638.png]]

- Biến số cốt lõi
- Interval: số ngày đến lần ôn tập tiếp theo 
- Ease Factor: hệ số thể hiện mức độ dễ/ khó mặc định là 2.5 - trung bình 
	- Nếu nhớ thì tăng lên 
	- Không nhớ thì giảm xuống 
- User đánh giá mức độ từ 0 - 5 
	- Nếu < 3 : reset toàn bộ, repetition về 0, interval về 1 ngày => EF giảm xuống 
	- Nếu >= 3: Tính interval mới theo quy tắc 
		- Đúng lần đầu: interval =1 ngày 
		- Đúng lần 2: n = 1, interval = 6 ngày 
		- Đúng lần 3: interval *= EF 
- repetition: số lần đã trả lời đúng liên tiếp 
# Cơ sở dữ liệu 
## user 
- Không thay đổi 
## vocabularies
- Không thay đổi
## card_reviews : trạng thái hiện tại của mỗi từ vựng 
- id 
- user_id 
- vocabulary_id 
- repetition: số lần trả lời đúng liên tiếp
- ease_factor: hệ số khó/ dễ của từ đối với user cụ thể 
	- ef cao -> interval tăng nhanh
	- ef thấp -> interval thấp -> ôn nhiều hơn 
- interval_days: khoảnh cách đã tính đưọc của lần ôn vừa rồi - dùng để nhân ef tính cho lần tiếp
- next_review_date: Ngày cần ôn tiếp theo 
- last_reviewed_at: lần cuối cùng ôn thẻ 
## review_logs : 
- id 
- user_id 
- card_review_id : thẻ nào vừa đưọc ôn 
- quality: điểm user tự chấm 
- ease_factor_before: ef trước
- ease_factor_after: ef sau khi tính từ quality
- interval_after: interval trước
- interval_before: interval sau khi tính từ ef 
- reviewed_at: thời gian user bấm nút 
# Giao diện 
- Chủ yếu nằm ở flashcard 
- Vocab sẽ hiển thị label: từ mới/ hôm nay/ quá hạn.... 
![[Pasted image 20260423170051.png]]

- Màn hình flashcard 
![[Pasted image 20260423170123.png]]

![[Pasted image 20260423170149.png]]

![[Pasted image 20260423170202.png]]

# Flow 
Khi 10 thẻ mới toanh, tất cả đều có trạng thái mặc định giống nhau:

|#|Từ|repetition|ease_factor|interval_days|next_review_date|
|---|---|---|---|---|---|
|1–10|tất cả|0|2.50|1|hôm nay|
### Phiên ôn đầu tiên — lần lượt từng thẻ

Vì tất cả đều `repetition=0`, thuật toán SM-2 **luôn hardcode interval=1 ngày** cho lần đầu tiên bất kể user bấm gì. EF vẫn được cập nhật bình thường.

---

**Thẻ 1 — ephemeral** · bấm **Dễ** (quality=5)

```
EF  = 2.50 + 0.10 = 2.60
interval = 1 ngày  ← hardcode, dù bấm Dễ
repetition = 1
```

---

**Thẻ 2 — meticulous** · bấm **Nhớ** (quality=4)

```
EF  = 2.50 + 0 = 2.50
interval = 1 ngày
repetition = 1
```

---

**Thẻ 3 — resilient** · bấm **Khó** (quality=3)

```
EF  = 2.50 − 0.14 = 2.36
interval = 1 ngày
repetition = 1
```

---

**Thẻ 4 — eloquent** · bấm **Quên** (quality=1)

```
EF  = 2.50 − 0.54 = 1.96
interval = 1 ngày  ← reset, nhưng vốn dĩ cũng là 1 ngày rồi
repetition = 0     ← vẫn là 0, chưa đúng lần nào
```

---

**Thẻ 5 — ambiguous** · bấm **Nhớ** (quality=4)

```
EF  = 2.50
interval = 1 ngày
repetition = 1
```

---

**Thẻ 6 — pragmatic** · bấm **Dễ** (quality=5)

```
EF  = 2.60
interval = 1 ngày
repetition = 1
```

---

**Thẻ 7 — diligent** · bấm **Khó** (quality=3)

```
EF  = 2.36
interval = 1 ngày
repetition = 1
```

---

**Thẻ 8 — nuance** · bấm **Quên** (quality=0)

```
EF  = 2.50 − 0.80 = 1.70
interval = 1 ngày
repetition = 0
```

---

**Thẻ 9 — tenacious** · bấm **Nhớ** (quality=4)

```
EF  = 2.50
interval = 1 ngày
repetition = 1
```

---

**Thẻ 10 — verbose** · bấm **Dễ** (quality=5)

```
EF  = 2.60
interval = 1 ngày
repetition = 1
```

### Trạng thái sau phiên đầu tiên

|#|Từ|quality|repetition|ease_factor|next_review_date|
|---|---|---|---|---|---|
|1|ephemeral|5|1|2.60|+1 ngày|
|2|meticulous|4|1|2.50|+1 ngày|
|3|resilient|3|1|2.36|+1 ngày|
|4|eloquent|1|**0**|1.96|+1 ngày|
|5|ambiguous|4|1|2.50|+1 ngày|
|6|pragmatic|5|1|2.60|+1 ngày|
|7|diligent|3|1|2.36|+1 ngày|
|8|nuance|0|**0**|1.70|+1 ngày|
|9|tenacious|4|1|2.50|+1 ngày|
|10|verbose|5|1|2.60|+1 ngày|
### Ngày 2 — phiên ôn thứ hai

Tất cả 10 thẻ đều due. Lần này `repetition` của 8 thẻ đang là 1 → interval sẽ **hardcode 6 ngày**. Chỉ eloquent và nuance vẫn là 0 vì hôm qua quên.

**eloquent** (repetition=0, EF=1.96) · bấm **Nhớ** (quality=4)

```
EF  = 1.96 + 0 = 1.96
interval = 1 ngày  ← vẫn hardcode vì repetition=0
repetition = 1
```

**nuance** (repetition=0, EF=1.70) · bấm **Khó** (quality=3)

```
EF  = 1.70 − 0.14 = 1.56
interval = 1 ngày
repetition = 1
```

**8 thẻ còn lại** (repetition=1) — giả sử tất cả bấm **Nhớ** (quality=4):

```
interval = 6 ngày  ← hardcode cho repetition=1
repetition = 2
EF giữ nguyên (quality=4 không đổi EF)
```
**Trạng thái cuối ngày 2:**

|#|Từ|repetition|ease_factor|next_review_date|
|---|---|---|---|---|
|1|ephemeral|2|2.60|+6 ngày|
|2|meticulous|2|2.50|+6 ngày|
|3|resilient|2|2.36|+6 ngày|
|4|eloquent|1|1.96|+1 ngày ← vẫn chậm hơn|
|5|ambiguous|2|2.50|+6 ngày|
|6|pragmatic|2|2.60|+6 ngày|
|7|diligent|2|2.36|+6 ngày|
|8|nuance|1|1.56|+1 ngày ← vẫn chậm hơn|
|9|tenacious|2|2.50|+6 ngày|
|10|verbose|2|2.60|+6 ngày|
### Ngày 3 — chỉ eloquent và nuance quay lại

eloquent và nuance lại gặp nhau lần nữa vì interval vẫn là 1 ngày. Lần này cả hai đều `repetition=1` → nếu trả lời đúng, interval nhảy lên **6 ngày**.

---

### Bức tranh toàn cảnh — lịch ôn tập 30 ngày đầu

```
Ngày 1:  10 thẻ  (lần đầu, tất cả)
Ngày 2:  10 thẻ  (lần 2, tất cả)
Ngày 3:   2 thẻ  (eloquent, nuance — bị reset ngày 1)
Ngày 8:   8 thẻ  (lần 3, nhân EF lần đầu tiên)
Ngày 9:   2 thẻ  (eloquent, nuance — lần 3)
                  ↓ từ đây interval bắt đầu phân kỳ mạnh
Ngày ~21:  EF cao (ephemeral 2.60) → interval ≈ 6×2.60 = 16 ngày
Ngày ~21:  EF thấp (nuance 1.56)   → interval ≈ 6×1.56 = 9 ngày
```

# Flow Anki 
- Cho hiển thị thẻ, images, dạng câu điền từ/ trắc nghiệm 
- User điền từ, sau khi submit hiển thị again < 1 minute| hard < 10 minute | Good | 1 day | Easy 5 day 