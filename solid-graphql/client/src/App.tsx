import {
	createClient,
	defaultExchanges,
	subscriptionExchange,
} from '@urql/core';
import { Component, createResource, createSignal, For } from 'solid-js';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import { pipe, subscribe } from 'wonka';

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
interface ChatMessage {
	id: string;
	text: string;
	from: string;
	time: string;
}
const [messages, setMessages] = createSignal<ChatMessage[]>([]);

const { unsubscribe } = pipe(
	client.subscription(`
    subscription MessagesSub {
      messages {
        id
        text
				from
				time
      }
    }
  `),
	subscribe((result) => {
		setMessages(result.data.messages);
	}),
);
const App: Component = () => {
	const [text, setText] = createSignal('');
	const [from, setFrom] = createSignal('Jeongkyu');

	const onAdd = async () => {
		await client
			.mutation(
				`
      mutation($text: String!, $from: String!, $time: String!) {
        add(text: $text, from: $from, time: $time) {
          id
        }
      }
    `,
				{ text: text(), from: from(), time: new Date().toLocaleTimeString() },
			)
			.toPromise()
			.then(() => {
				setText('');
			});
	};
	return (
		<div>
			<For each={messages()}>
				{({ text, from, time }) => (
					<div>
						<p>
							<strong>{from}</strong>: <span>{text}</span>
						</p>
						<span>{time}</span>
					</div>
				)}
			</For>
			<div>
				<input
					type='text'
					value={from()}
					oninput={(evt) => setFrom(evt.currentTarget.value)}
				/>
				<input
					type='text'
					value={text()}
					oninput={(evt) => setText(evt.currentTarget.value)}
				/>
				<button onclick={onAdd}>Send</button>
			</div>
		</div>
	);
};

export default App;
