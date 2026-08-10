declare module "react-toggle-dark-mode" {
  import type { CSSProperties, MouseEvent } from "react";

  export interface DarkModeSwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    style?: CSSProperties;
    size?: number | string;
    moonColor?: string;
    sunColor?: string;
    "aria-label"?: string;
    "aria-labelledby"?: string;
    onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  }

  export function DarkModeSwitch(props: DarkModeSwitchProps): JSX.Element;
}
