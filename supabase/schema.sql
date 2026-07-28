-- 留言板数据表 + 权限策略
-- 在 Supabase 项目的 SQL Editor 里整段执行一次即可

create table if not exists guestbook_messages (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  nickname text,
  category text not null check (category in ('功能建议', 'Bug反馈', '单纯想说的话')),
  message text not null check (char_length(message) between 1 and 2000),
  status text not null default 'pending' check (status in ('pending', 'approved', 'ignored'))
);

alter table guestbook_messages enable row level security;

-- 访客（用 anon key）只能新建留言，而且只能新建成"待审核"状态，不能自己把留言标成已通过
create policy "public can submit messages"
  on guestbook_messages for insert
  to anon
  with check (status = 'pending');

-- 访客只能读到"已通过"的留言，读不到别人的待审核内容
create policy "public can read approved messages"
  on guestbook_messages for select
  to anon
  using (status = 'approved');

-- 没有给 anon 角色开 update/delete 权限，所以待审核留言只能通过后台的
-- Vercel serverless function（用 service_role key，绕过 RLS）来改状态。
