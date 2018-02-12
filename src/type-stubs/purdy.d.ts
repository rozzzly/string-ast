declare module 'purdy' {

    export interface PurdyOptions {
        /**
         * When true, prints result without colors.
         *
         * @default false when tty detected
         * @default true when tty not detected
         */
        plain: boolean;
        /**
         * When true, prints result with a path ( to be used with @see Hoek.reach() )
         *
         */
        path: boolean;
        /**
         * Prefix for path
         *
         * @default '//'
         */
        pathPrefix: string;
        /**
         * Enables index printing for arrays
         *
         * @default true
         */
        arrayIndex: boolean;
        /**
         * Defines the number of spaces to indent
         *
         * @default 4
         */
        indent: number;
        /**
         * Determines how to align object keys
         *
         * @default left
         */
        align: 'left' | 'right';
        /**
         * Tells purdy how many times to recurse while formatting the object.
         * This is useful for viewing complicated objects.
         *
         * **Set to null to recurse indefinitely **
         *
         * @default 2
         */
        depth: number | null;
    }

    export function stringify(value: any): string;
    export function stringify(value: any, options: Partial<PurdyOptions>): string;
}