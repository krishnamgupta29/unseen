import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Post from '@/models/Post';
import Conversation from '@/models/Conversation';
import Message from '@/models/Message';

export async function GET() {
  try {
    await dbConnect();
    
    const [users, posts, conversations] = await Promise.all([
      User.find({}),
      Post.find({}).populate('profileId').sort({ createdAt: -1 }),
      Conversation.find({}).populate('participants'),
    ]);

    return NextResponse.json({
      users,
      posts,
      conversations,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
