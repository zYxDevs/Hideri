import { AppDiscord } from "./AppDiscord";
import moment from 'moment';
import moment_duration_format from 'moment-duration-format';

moment_duration_format(moment);

AppDiscord.start();

['SIGTERM', 'SIGINT'].forEach((signal: NodeJS.Signals) => {
    process.on(signal, () => {
        AppDiscord.destroy().finally(() => process.exit(0));
    })
});