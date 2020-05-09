import dist from 'grosso-modo';
export class RandomUtils {
    public static randint(minimum: number, maximum: number) {
        return Math.floor(Math.random() * (maximum - minimum + 1)) + minimum;
    }

    public static choice<T>(array: Array<T>): T {
        return array[Math.floor(Math.random() * array.length)];
    }

    public static gaussian(lower: number, upper: number, probability = .99) {
        const distribution = new dist.norm(lower, upper, probability);

        return distribution();
    }

    public static create_randomizer(array: Array<any>, options: {
        perceived_random: boolean
    } = { perceived_random: true }) {
        let last_index = -1;
        
        if (options.perceived_random) {
            return () => {
                if (array.length < 2) return array[0];
                let new_index = 0;
                do {
                    new_index = Math.floor(Math.random() * array.length);
                } while (new_index == last_index);

                last_index = new_index;
                return array[new_index];
            };
        }
        
        return () => this.choice(array);
    }
}