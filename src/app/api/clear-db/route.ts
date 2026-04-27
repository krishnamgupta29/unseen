import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';

export async function GET() {
  try {
    await dbConnect();
    
    // Delete all records to start fresh
    await Promise.all([
      User.deleteMany({}),
      Post.deleteMany({}),
      Comment.deleteMany({}),
      Conversation.deleteMany({}),
      Message.deleteMany({}),
    ]);

    return NextResponse.json({ message: 'Database cleared successfully! You can now start with a completely fresh platform.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
