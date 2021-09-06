import {
	createClient,
	defaultExchanges,
	subscriptionExchange,
} from '@urql/core';
import { Component, createResource, createSignal, For } from 'solid-js';
import { SubscriptionClient } from 'subscriptions-transport-ws';

const subscriptionClient = new SubscriptionClient('ws://localhost:4000', {
	reconnect: true,
});
const client = createClient({
	url: 'http://localhost:4000',
	exchanges: [
		...defaultExchanges,
		subscriptionExchange({
			forwardSubscription: (operation) =>
				subscriptionClient.request(operation) as any,
		}),
	],
});

const [todos, { refetch }] = createResource(() =>
	client
		.query(
			`query {
        getTodos {
          id
          done
          text
        }
      }
  `,
		)
		.toPromise()
		.then(({ data }) => data.getTodos),
);

const App: Component = () => {
	const [text, setText] = createSignal('');
	const onAdd = async () => {
		await client
			.mutation(
				`
      mutation($text: String!) {
        addTodo(text: $text) {
          id
        }
      }
    `,
				{ text: text() },
			)
			.toPromise()
			.then(() => {
				refetch();
				setText('');
			});
	};
	const toggleTodo = async (id: string) => {
		await client
			.mutation(
				`
      mutation($id: ID!, $done: Boolean!) {
        setDone(id: $id, done: $done) {
          id
        }
      }
    `,
				{ id, done: !todos().find((todo) => todo.id === id) },
			)
			.toPromise()
			.then(() => {
				// refetch();
			});
	};
	return (
		<div>
			<For each={todos()}>
				{({ id, done, text }) => (
					<div>
						<input
							type='checkbox'
							checked={done}
							onclick={() => toggleTodo(id)}
						/>
						{text}
					</div>
				)}
			</For>
			<div>
				<input
					type='text'
					value={text()}
					oninput={(evt) => setText(evt.currentTarget.value)}
				/>
				<button onclick={onAdd}>Add</button>
			</div>
		</div>
	);
};

export default App;
