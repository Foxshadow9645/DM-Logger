export function safeUser(user) {
  return user?.tag ? `${user.tag} (ID: ${user.id})` : "Unknown User";
}
