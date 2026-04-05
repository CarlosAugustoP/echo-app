import { Text, View } from "react-native";
type StrongProps = {
    children: React.ReactNode;
    className?: string;
}
export const Strong = ({ children, className }: StrongProps) => {
  return <Text className={`font-bold ${className || ''}`}>{children}</Text>;
}