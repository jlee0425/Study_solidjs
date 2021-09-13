import { GraphQLServer, PubSub } from 'graphql-yoga';

const CHAT_CHANNEL = 'CHAT_CHANNEL';
const pubsub = new PubSub();
let messages: { id: string; text: string; from: string; time: string }[] = [];

const typeDefs = `
  type ChatMessage {
    id: ID!
    text: String!
		from: String!
		time: String!
  }
  type Query {
    messages: [ChatMessage]!
  }
  type Mutation {
    add(text: String!, from: String!, time: String!): ChatMessage
  }
  type Subscription {
    messages: [ChatMessage]!
  }
`;

const resolvers = {
	Query: {
		messages: () => {
			return messages;
		},
	},
	Mutation: {
		add: (
			_: unknown,
			{ text, from, time }: { text: string; from: string; time: string },
			{ pubsub }: { pubsub: PubSub },
		) => {
			const newMessage = {
				id: String(messages.length + 1),
				text,
				from,
				time,
			};
			messages.push(newMessage);
			pubsub.publish(CHAT_CHANNEL, { messages });
			return newMessage;
		},
	},
	Subscription: {
		messages: {
			subscribe: () => {
				const iterator = pubsub.asyncIterator(CHAT_CHANNEL);
				pubsub.publish(CHAT_CHANNEL, { messages });
				return iterator;
			},
		},
	},
};

const server = new GraphQLServer({
	typeDefs,
	resolvers,
	context: { pubsub },
});

server.start(() => console.log(`Server is running on http://localhost:4000`));
