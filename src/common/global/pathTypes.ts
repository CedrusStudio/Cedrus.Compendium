// Only string keys
type Keys<T> = Extract<keyof T, string>; 

// Produces the string literal type ${K}.${P}.
type Join<K extends string, P extends string> = `${K}.${P}`;

// Recursively find all paths in GetKeysFrom that lead to a type assignable to IfKeyExtends
export type PathsFrom<GetKeysFrom, IfKeyExtends> = 
{
  [Key in Keys<GetKeysFrom>]: 
    GetKeysFrom[Key] extends IfKeyExtends
      ? Key
      : Join<Key, PathsFrom<GetKeysFrom[Key], IfKeyExtends>>
}[Keys<GetKeysFrom>];
