import { NextRequest, NextResponse } from 'next/server';
import { createUser, getUserByEmail } from '@/lib/auth-helpers';
import validationService from '@/lib/validation';

const signupSchema = {
  name: {
    required: true,
    minLength: 1,
    maxLength: 50,
    sanitize: true,
  },
  email: {
    required: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    sanitize: true,
    maxLength: 255,
  },
  password: {
    required: true,
    minLength: 6,
    maxLength: 128,
    sanitize: false, // Don't sanitize passwords
  },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input using the validation service
    const validationResult = validationService.validate(body, signupSchema);
    if (!validationResult.isValid) {
      const firstError = Object.values(validationResult.errors)[0];
      return NextResponse.json(
        { error: firstError },
        { status: 400 }
      );
    }

    const { name, email, password } = validationResult.sanitizedData as {
      name: string;
      email: string;
      password: string;
    };

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Create the user
    const user = await createUser(email, password, name);

    return NextResponse.json(
      {
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}