import './style.css';

type Question = { id: number; question: string; answer: string };

const health = document.querySelector('#health')!;
const form = document.querySelector('form')!;
const list = document.querySelector('#questions')!;

async function refresh() {
  const status = await fetch('/api/health').then((r) => r.json());
  health.textContent = `API OK · ${status.db}`;

  const questions: Question[] = await fetch('/api/questions').then((r) =>
    r.json(),
  );
  list.replaceChildren(
    ...questions.map((q) => {
      const item = document.createElement('li');
      item.className =
        'flex flex-col gap-1 rounded-card border border-border bg-surface p-4';
      const asked = document.createElement('p');
      asked.className = 'font-medium';
      asked.textContent = q.question;
      const answer = document.createElement('p');
      answer.className = 'text-muted';
      answer.textContent = q.answer;
      item.append(asked, answer);
      return item;
    }),
  );
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const question = new FormData(form).get('question');
  await fetch('/api/questions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  });
  form.reset();
  await refresh();
});

refresh();