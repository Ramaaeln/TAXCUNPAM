// Serialize writes so a slow older answer cannot overwrite a newer one.
export function createAnswerQueue(save) {
  const pending = new Map();
  let running = null;
  function enqueue(question, answer) {
    pending.set(question.id, { question, answer });
  }
  function flush() {
    if (running) return running;
    running = (async () => {
      while (pending.size) {
        const [id, entry] = pending.entries().next().value;
        await save(entry.question, entry.answer);
        if (pending.get(id) === entry) pending.delete(id);
      }
    })().finally(() => { running = null; });
    return running;
  }
  return { enqueue, flush };
}
