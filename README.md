# YACTH

웹 기반

rolling 후 score보드 업데이트
버튼 html 수정 시 상대 화면에도 수정된 값 전달 -> 버튼의 위치만 서버로 전달해 서버에서 같은 room내부의 client에게 값을 뿌려주는 방식으로 해결해야 할듯
bonus total은 언제 업데이트?
주사위 오디오
게임로직
게임 종료 이벤트
버튼 스타일 구림


이스터에그
isMyTurn - 수정할까말까

클라이언트에서 값을 조작해 게임진행에 치명적인 이상을 줄만한 코드는 다 서버사이드로 빼둠. (isMyTurn 제외)

[게임 링크](https://yachoo.herokuapp.com/)