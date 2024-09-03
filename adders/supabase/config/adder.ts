import { defineAdderConfig, dedent, type TextFileEditorArgs, colors } from '@svelte-add/core';
import { options as availableOptions } from './options';

export const adder = defineAdderConfig({
	metadata: {
		id: 'supabase',
		name: 'Supabase',
		description: `Supabase is an open source Firebase alternative.
Start your project with a Postgres database, Authentication, instant APIs, Edge Functions, Realtime subscriptions, Storage, and Vector embeddings.`,
		environments: { svelte: false, kit: true },
		website: {
			logo: './supabase.svg',
			keywords: ['supabase', 'database', 'postgres', 'auth'],
			documentation: 'https://supabase.com/docs',
		},
	},
	options: availableOptions,
	integrationType: 'inline',
	packages: [
		{ name: '@supabase/supabase-js', version: '^2.45.3', dev: false },
		{ name: '@supabase/ssr', version: '^0.5.1', dev: false },
		// Local development CLI
		{
			name: 'supabase',
			version: '^1.191.3',
			dev: true,
			condition: ({ options }) => options.cli,
		},
	],
	files: [
		{
			name: () => `.env`,
			contentType: 'text',
			content: generateEnvFileContent,
		},
		{
			name: () => `.env.example`,
			contentType: 'text',
			content: generateEnvFileContent,
		},
		{
			name: ({ typescript }) => `./src/hooks.server.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'text',
			content: ({ options, typescript }) => {
				return dedent`
					import { createServerClient } from '@supabase/ssr'
					import {${typescript.installed ? ' type Handle,' : ''} redirect } from '@sveltejs/kit'
					import { sequence } from '@sveltejs/kit/hooks'

					import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

					const supabase${typescript.installed ? ': Handle' : ''} = async ({ event, resolve }) => {
						event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
							cookies: {
								getAll: () => event.cookies.getAll(),
								setAll: (cookiesToSet) => {
									cookiesToSet.forEach(({ name, value, options }) => {
										event.cookies.set(name, value, { ...options, path: '/' })
									})
								},
							},
						})

						event.locals.safeGetSession = async () => {
							const {
								data: { session },
							} = await event.locals.supabase.auth.getSession()
							if (!session) {
								return { session: null, user: null }
							}

							const {
								data: { user },
								error,
							} = await event.locals.supabase.auth.getUser()
							if (error) {
								return { session: null, user: null }
							}

							return { session, user }
						}

						return resolve(event, {
							filterSerializedResponseHeaders(name) {
								return name === 'content-range' || name === 'x-supabase-api-version'
							},
						})
					}

					const authGuard${typescript.installed ? ': Handle' : ''} = async ({ event, resolve }) => {
						const { session, user } = await event.locals.safeGetSession()
						event.locals.session = session
						event.locals.user = user
						${
							options.demo
								? `
						if (!event.locals.session && event.url.pathname.startsWith('/private')) {
							redirect(303, '/auth')
						}

						if (event.locals.session && event.url.pathname === '/auth') {
							redirect(303, '/private')
						}
						`
								: `
						// Add authentication guards here
						`
						}
						return resolve(event)
					}

					export const handle${typescript.installed ? ': Handle' : ''} = sequence(supabase, authGuard)
					`;
			},
		},
		{
			name: () => './src/app.d.ts',
			contentType: 'text',
			condition: ({ typescript }) => typescript.installed,
			content: ({ options }) => {
				return dedent`
					import type { Session, SupabaseClient, User } from '@supabase/supabase-js'
					${options.cli && options.helpers ? `import type { Database } from '$lib/supabase-types'\n` : ''}
					declare global {
						namespace App {
							// interface Error {}
							interface Locals {
								supabase: SupabaseClient${options.cli && options.helpers ? `<Database>` : ''}
								safeGetSession: () => Promise<{ session: Session | null; user: User | null }>
								session: Session | null
								user: User | null
							}
							interface PageData {
								session: Session | null
							}
						// interface PageState {}
						// interface Platform {}
						}
					}

					export {}
					`;
			},
		},
		{
			name: ({ kit, typescript }) =>
				`${kit.routesDirectory}/+layout.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'text',
			content: ({ typescript }) => {
				return dedent`
					import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr'
					import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public'
					${typescript.installed ? `import type { LayoutLoad } from './$types'\n` : ''}
					export const load${typescript.installed ? ': LayoutLoad' : ''} = async ({ data, depends, fetch }) => {
						depends('supabase:auth')

						const supabase = isBrowser()
							? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
									global: { fetch },
								})
							: createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
									global: { fetch },
								cookies: {
									getAll() {
										return data.cookies
									},
								},
							})

						const {
							data: { session },
						} = await supabase.auth.getSession()

						const {
							data: { user },
						} = await supabase.auth.getUser()

						return { session, supabase, user }
					}
					`;
			},
		},
		{
			name: ({ kit, typescript }) =>
				`${kit.routesDirectory}/+layout.server.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'text',
			content: ({ typescript }) => {
				return dedent`
					${typescript.installed ? `import type { LayoutServerLoad } from './$types'\n` : ''}
					export const load${typescript.installed ? ': LayoutServerLoad' : ''} = async ({ locals: { session }, cookies }) => {
						return {
							session,
							cookies: cookies.getAll(),
						}
					}
					`;
			},
		},
		{
			name: ({ kit }) => `${kit.routesDirectory}/+layout.svelte`,
			contentType: 'text',
			content: ({ typescript }) => {
				return dedent`
					<script${typescript.installed ? ' lang="ts"' : ''}>
						import { invalidate } from '$app/navigation';
						import { onMount } from 'svelte';

						export let data;
						$: ({ session, supabase } = data);

						onMount(() => {
							const { data } = supabase.auth.onAuthStateChange((_, newSession) => {
								if (newSession?.expires_at !== session?.expires_at) {
									invalidate('supabase:auth');
								}
							});

							return () => data.subscription.unsubscribe();
						});
					</script>

					<slot />
					`;
			},
		},
		{
			name: ({ kit, typescript }) =>
				`${kit.routesDirectory}/auth/+page.server.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'text',
			content: ({ typescript }) => {
				return dedent`
					import { redirect } from '@sveltejs/kit'
					${typescript.installed ? `import type { Actions } from './$types'` : ''}
					export const actions${typescript.installed ? `: Actions` : ''} = {
						signup: async ({ request, locals: { supabase } }) => {
							const formData = await request.formData()
							const email = formData.get('email')${typescript.installed ? ' as string' : ''}
							const password = formData.get('password')${typescript.installed ? ' as string' : ''}

							const { error } = await supabase.auth.signUp({ email, password })
							if (error) {
								console.error(error)
								redirect(303, '/auth/error')
							} else {
								redirect(303, '/')
							}
						},
						login: async ({ request, locals: { supabase } }) => {
							const formData = await request.formData()
							const email = formData.get('email')${typescript.installed ? ' as string' : ''}
							const password = formData.get('password')${typescript.installed ? ' as string' : ''}

							const { error } = await supabase.auth.signInWithPassword({ email, password })
							if (error) {
								console.error(error)
								redirect(303, '/auth/error')
							} else {
								redirect(303, '/private')
							}
						},
					}
					`;
			},
		},
		{
			name: ({ kit }) => `${kit.routesDirectory}/auth/+page.svelte`,
			contentType: 'text',
			content: () => {
				return dedent`
					<form method="POST" action="?/login">
						<label>
							Email
							<input name="email" type="email" />
						</label>
						<label>
							Password
							<input name="password" type="password" />
						</label>
						<button>Login</button>
						<button formaction="?/signup">Sign up</button>
					</form>
					`;
			},
		},
		{
			name: ({ kit }) => `${kit.routesDirectory}/auth/error/+page.svelte`,
			contentType: 'text',
			content: () => {
				return '<p>Login error</p>';
			},
		},
		{
			name: ({ kit, typescript }) =>
				`${kit.routesDirectory}/auth/confirm/+server.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'text',
			content: ({ typescript }) => {
				return dedent`
					import { redirect } from '@sveltejs/kit'
					${
						typescript.installed
							? dedent`import type { EmailOtpType } from '@supabase/supabase-js'
							         import type { RequestHandler } from './$types'
									 `
							: ''
					}
					export const GET${typescript.installed ? ': RequestHandler' : ''} = async ({ url, locals: { supabase } }) => {
						const token_hash = url.searchParams.get('token_hash')
						const type = url.searchParams.get('type')${typescript.installed ? ' as EmailOtpType | null' : ''}
						const next = url.searchParams.get('next') ?? '/'

						const redirectTo = new URL(url)
						redirectTo.pathname = next
						redirectTo.searchParams.delete('token_hash')
						redirectTo.searchParams.delete('type')

						if (token_hash && type) {
							const { error } = await supabase.auth.verifyOtp({ type, token_hash })
							if (!error) {
								redirectTo.searchParams.delete('next')
								redirect(303, redirectTo)
							}
						}

						redirectTo.pathname = '/auth/error'
						redirect(303, redirectTo)
					}
					`;
			},
		},
		{
			name: ({ kit, typescript }) =>
				`${kit.libDirectory}/server/supabase-admin.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'text',
			content: ({ options, typescript }) => {
				return dedent`
					import { PUBLIC_SUPABASE_URL } from '$env/static/public'
					import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private'
					${typescript && options.cli && options.helpers ? `import type { Database } from '$lib/supabase-types'\n` : ''}
					import { createClient } from '@supabase/supabase-js'

					export const supabaseAdmin = createClient${typescript && options.cli && options.helpers ? '<Database>' : ''}(
						PUBLIC_SUPABASE_URL,
						SUPABASE_SERVICE_ROLE_KEY,
						{
							auth: {
								autoRefreshToken: false,
								persistSession: false,
							},
						},
					);
					`;
			},
			condition: ({ options }) => options.admin,
		},
		{
			name: () => `package.json`,
			contentType: 'json',
			content: ({ data, typescript }) => {
				data.scripts ??= {};
				const scripts: Record<string, string> = data.scripts;
				scripts['db:migration'] ??= 'supabase migration new';
				scripts['db:migration:up'] ??= 'supabase migration up --local';
				scripts['db:reset'] ??= 'supabase db reset';
				if (typescript.installed) {
					scripts['db:types'] ??=
						'supabase gen types typescript --local > src/lib/supabase-types.ts';
				}
			},
			condition: ({ options }) => options.helpers,
		},
		// Demo routes
		{
			name: ({ kit, typescript }) =>
				`${kit.routesDirectory}/private/+layout.server.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'text',
			content: () => {
				return dedent`
					/**
					* This file is necessary to ensure protection of all routes in the \`private\`
					* directory. It makes the routes in this directory _dynamic_ routes, which
					* send a server request, and thus trigger \`hooks.server.ts\`.
					**/
					`;
			},
			condition: ({ options }) => options.demo,
		},
		{
			name: ({ kit }) => `${kit.routesDirectory}/private/+layout.svelte`,
			contentType: 'text',
			content: () => {
				return dedent`
					<script>
						export let data;
						$: ({ supabase } = data);

						$: logout = async () => {
							const { error } = await supabase.auth.signOut();
							if (error) {
								console.error(error);
							}
						};
					</script>

					<header>
						<nav>
							<a href="/">Home</a>
						</nav>
						<button on:click={logout}>Logout</button>
					</header>
					<main>
						<slot />
					</main>
					`;
			},
			condition: ({ options }) => options.demo,
		},
		{
			name: ({ kit }) => `${kit.routesDirectory}/private/+page.svelte`,
			contentType: 'text',
			content: ({ options, typescript }) => {
				return dedent`
					<script${typescript.installed ? ' lang="ts"' : ''}>
						import { invalidate } from '$app/navigation'
						${typescript.installed ? `import type { EventHandler } from 'svelte/elements'\n` : ''}
						${typescript.installed ? `import type { PageData } from './$types'\n` : ''}
						export let data${typescript.installed ? ': PageData' : ''}

						$: ({ ${options.cli ? 'notes, supabase, user' : 'user'} } = data)
						${
							options.cli
								? `
						let handleSubmit${typescript.installed ? ': EventHandler<SubmitEvent, HTMLFormElement>' : ''}
						$: handleSubmit = async (evt) => {
							evt.preventDefault();
							if (!evt.target) return;

							const form = evt.target${typescript.installed ? ' as HTMLFormElement' : ''}

							const note = (new FormData(form).get('note') ?? '')${typescript.installed ? ' as string' : ''}
							if (!note) return;

							const { error } = await supabase.from('notes').insert({ note });
							if (error) console.error(error);

							invalidate('supabase:db:notes');
							form.reset();
						}
							`
								: ''
						}
					</script>

					<h1>Private page for user: {user?.email}</h1>
					${
						options.cli
							? `
					<h2>Notes</h2>
					<ul>
						{#each notes as note}
							<li>{note.note}</li>
						{/each}
					</ul>
					<form on:submit={handleSubmit}>
						<label>
							Add a note
							<input name="note" type="text" />
						</label>
					</form>
							`
							: ''
					}
					`;
			},
			condition: ({ options }) => options.demo,
		},
		{
			name: ({ kit, typescript }) =>
				`${kit.routesDirectory}/private/+page.server.${typescript.installed ? 'ts' : 'js'}`,
			contentType: 'text',
			content: ({ typescript }) => {
				return dedent`
					${typescript.installed ? `import type { PageServerLoad } from './$types'\n` : ''}
					export const load${typescript.installed ? ': PageServerLoad' : ''} = async ({ depends, locals: { supabase } }) => {
						depends('supabase:db:notes')
						const { data: notes } = await supabase.from('notes').select('id,note').order('id')
						return { notes: notes ?? [] }
					}
					`;
			},
			condition: ({ options }) => options.demo && options.cli,
		},
		{
			name: () => './supabase/migrations/00000000000000_demo.sql',
			contentType: 'text',
			content: () => {
				return dedent`
					create table notes (
						id bigint primary key generated always as identity,
						created_at timestamp with time zone not null default now(),
						user_id uuid references auth.users on delete cascade not null default auth.uid(),
						note text not null
					);

					alter table notes enable row level security;

					revoke all on table notes from authenticated;
					revoke all on table notes from anon;

					grant all (note) on table notes to authenticated;
					grant select (id) on table notes to authenticated;
					grant delete on table notes to authenticated;

					create policy "Users can access and modify their own notes"
					on notes
					for all
					to authenticated
					using ((select auth.uid()) = user_id);
					`;
			},
			condition: ({ options }) => options.demo && options.cli,
		},
	],
	nextSteps: ({ options, packageManager }) => {
		const steps = [
			'Visit the Supabase docs: https://supabase.com/docs',
			'Update the authGuard server hook function with your protected routes',
		];

		if (options.cli) {
			steps.push(
				dedent`Local development environment:

					1. Initialize the local development environment: ${colors.yellow(`${packageManager} supabase init`)}
					2. Start the local development services: ${colors.yellow(`${packageManager} supabase start`)}. This may take a while the first time you run it
					3. Update ${colors.green('./supabase/config.toml')} [auth] section \`site_url\` and \`additional_redirect_urls\` to use port 5173
					4. Depending on your Auth selections, you may need to create local email templates and update ${colors.green('./supabase/config.toml')}
					`,
			);
		}

		return steps;
	},
});

function generateEnvFileContent({ content, options }: TextFileEditorArgs<typeof availableOptions>) {
	content = addEnvVar(
		content,
		'PUBLIC_SUPABASE_URL',
		// Local development env always has the same credentials, prepopulate the local dev env file
		options.cli ? '"http://127.0.0.1:54321"' : '"<your_supabase_project_url>"',
	);
	content = addEnvVar(
		content,
		'PUBLIC_SUPABASE_ANON_KEY',
		// Local development env always has the same credentials, prepopulate the local dev env file
		options.cli
			? '"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"'
			: '"<your_supabase_anon_key>"',
	);

	content = options.admin
		? addEnvVar(
				content,
				'SUPABASE_SERVICE_ROLE_KEY',
				// Local development env always has the same credentials, prepopulate the local dev env file
				options.cli
					? '"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"'
					: '"<your_supabase_service_role_key>"',
			)
		: content;

	return content;
}

function addEnvVar(content: string, key: string, value: string) {
	if (!content.includes(key + '=')) {
		content = appendEnvContent(content, `${key}=${value}`);
	}
	return content;
}

function appendEnvContent(existing: string, content: string) {
	const withNewLine = !existing.length || existing.endsWith('\n') ? existing : existing + '\n';
	return withNewLine + content + '\n';
}
