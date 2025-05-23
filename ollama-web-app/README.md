# Ollama Web Chat

A modern, full-featured web application for chatting with Ollama models. Built with Next.js, TypeScript, and Tailwind CSS.

## Features

- 🚀 **Real-time streaming** - Live token streaming from Ollama
- 💬 **Persistent conversations** - Chat history saved to database
- 🔐 **User authentication** - Session management with NextAuth.js
- 🎯 **Model switching** - Dynamic model selection
- 📊 **Performance stats** - Token count and generation speed
- 🎨 **Modern UI** - Responsive design with dark/light mode support
- 🔄 **Conversation management** - Create, edit, and delete conversations
- ⚙️ **Advanced settings** - Temperature control, system prompts

## Prerequisites

- [Bun](https://bun.sh) runtime
- [Ollama](https://ollama.ai) server running locally
- Node.js 18+ (for compatibility)

## Installation

1. **Clone and navigate to the project:**
   ```bash
   cd ollama-web-app
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

3. **Set up the database:**
   ```bash
   bun run prisma generate
   bun run prisma db push
   ```

4. **Configure environment variables:**
   Copy `.env.local` and update if needed:
   ```bash
   # Database
   DATABASE_URL="file:./dev.db"

   # NextAuth.js
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here-change-in-production"

   # Ollama
   OLLAMA_BASE_URL="http://localhost:11434"
   NEXT_PUBLIC_OLLAMA_BASE_URL="http://localhost:11434"
   ```

## Usage

1. **Start Ollama server:**
   ```bash
   ollama serve
   ```

2. **Pull some models (if you haven't already):**
   ```bash
   ollama pull llama3.2
   ollama pull codellama
   ```

3. **Start the development server:**
   ```bash
   bun run dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

5. **Sign in:**
   Use the guest credentials:
   - Email: `guest@example.com`
   - Password: `guest`

## Project Structure

```
ollama-web-app/
├── src/
│   ├── app/                    # Next.js app router
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # NextAuth.js
│   │   │   ├── chat/          # Chat streaming
│   │   │   ├── conversations/ # Conversation CRUD
│   │   │   └── models/        # Ollama models
│   │   ├── auth/              # Authentication pages
│   │   └── globals.css        # Global styles
│   ├── components/            # React components
│   │   ├── chat/              # Chat interface
│   │   ├── layout/            # Layout components
│   │   ├── providers/         # Context providers
│   │   └── ui/                # Reusable UI components
│   ├── lib/                   # Utility libraries
│   │   ├── auth.ts            # NextAuth configuration
│   │   ├── db.ts              # Prisma client
│   │   ├── ollama-client.ts   # Ollama API client
│   │   └── utils.ts           # Helper functions
│   ├── stores/                # Zustand state management
│   └── types/                 # TypeScript type definitions
├── prisma/                    # Database schema
└── public/                    # Static assets
```

## Key Features

### Chat Interface
- Real-time message streaming
- Message history with timestamps
- User and assistant message bubbles
- Typing indicators during streaming

### Conversation Management
- Create new conversations
- Browse conversation history
- Delete conversations
- Auto-generated conversation titles

### Model Integration
- Dynamic model listing from Ollama
- Model switching per conversation
- Temperature and system prompt controls
- Performance statistics display

### Database Schema
- Users and authentication
- Conversations with settings
- Messages with metadata
- User preferences

## API Endpoints

- `GET /api/conversations` - List user conversations
- `POST /api/conversations` - Create new conversation
- `GET /api/conversations/[id]` - Get conversation with messages
- `PUT /api/conversations/[id]` - Update conversation
- `DELETE /api/conversations/[id]` - Delete conversation
- `POST /api/chat` - Send message and stream response
- `GET /api/models` - List available Ollama models

## Development

### Database Changes
```bash
# After modifying schema.prisma
bun run prisma generate
bun run prisma db push
```

### Adding New Components
```bash
# Create new UI components in src/components/ui/
# Follow the existing patterns for consistency
```

### Environment Setup
- Development: SQLite database
- Production: Can be upgraded to PostgreSQL
- Authentication: Currently demo credentials, extend for production

## Production Deployment

1. **Update environment variables:**
   - Set secure `NEXTAUTH_SECRET`
   - Configure production database URL
   - Set proper `NEXTAUTH_URL`

2. **Database migration:**
   ```bash
   # For PostgreSQL in production
   bun run prisma migrate deploy
   ```

3. **Build and start:**
   ```bash
   bun run build
   bun run start
   ```

## Troubleshooting

### Common Issues

1. **Ollama connection failed:**
   - Ensure Ollama is running: `ollama serve`
   - Check the URL in environment variables
   - Verify models are pulled: `ollama list`

2. **Database errors:**
   - Regenerate Prisma client: `bun run prisma generate`
   - Reset database: `bun run prisma db push --force-reset`

3. **Authentication issues:**
   - Check `NEXTAUTH_SECRET` is set
   - Verify `NEXTAUTH_URL` matches your domain

### Performance Tips

- Use streaming for better perceived performance
- Implement conversation pagination for large histories
- Consider Redis for session storage in production
- Optimize database queries with proper indexing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- Built on the excellent [Ollama](https://ollama.ai) project
- UI components inspired by [shadcn/ui](https://ui.shadcn.com)
- Authentication powered by [NextAuth.js](https://next-auth.js.org)
