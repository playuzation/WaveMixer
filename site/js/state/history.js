// 상태 스냅샷을 쌓아 undo/redo를 제공하는 범용 히스토리.
// 스냅샷은 불변 값으로 다룬다(수정하지 않고 새 값을 push).
export function createHistory(initial) {
  const past = [];
  const future = [];
  let present = initial;

  return {
    get present() {
      return present;
    },
    get canUndo() {
      return past.length > 0;
    },
    get canRedo() {
      return future.length > 0;
    },
    push(next) {
      past.push(present);
      present = next;
      future.length = 0;
    },
    undo() {
      if (past.length) {
        future.push(present);
        present = past.pop();
      }
      return present;
    },
    redo() {
      if (future.length) {
        past.push(present);
        present = future.pop();
      }
      return present;
    },
  };
}
