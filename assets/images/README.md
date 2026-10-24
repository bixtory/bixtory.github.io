# 기존 이미지 자료

기존 PNG와 같은 크기로 변환한 WebP 파생 파일을 보관한다.
현재 메인 페이지의 그래픽은 `index.html`의 SVG와 CSS에서 관리한다.
아래 변환 정보는 보관 중인 파생 파일의 출처를 설명한다.

## 재생성

Pillow의 `Image.open`으로 PNG를 읽고 RGB로 변환한다.
`save`에 `format="WEBP"`, `quality=80`, `method=6`을 지정한다.
변환 후 원본과 화면 내용을 대조하고 브라우저의 실제 표시를 확인한다.

| 원본 | 파생 파일 |
| --- | --- |
| `bg-hero.png` | `bg-hero.webp` |
| `img-philosophy.png` | `img-philosophy.webp` |
| `img-trust.png` | `img-trust.webp` |

## 변환에 사용한 원본 SHA-256

```text
bg-hero.png
1081a8b2259cbeab1be1cb08152375e7610edbe28800b42c365e3de10de3b8c1

img-philosophy.png
a8523101fa9e7e4d0169eb5355627a19ca33a8c9c215c4f23940fdcd0af8fbe7

img-trust.png
2ebdcde98141f11d98bbfaf2a9d6633c678584241d3451daf0272760e6ae2690
```
