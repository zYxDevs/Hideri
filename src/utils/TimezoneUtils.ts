const regions = {
    'brazil': 'America/Sao_Paulo',
    'europe': 'Europe/London',
    'hongkong': 'Asia/Hong_Kong',
    'india': 'Asia/Kolkata',
    'japan': 'Asia/Tokyo',
    'russia': 'Europe/Moscow',
    'singapore': 'Asia/Singapore',
    'southafrica': 'Africa/Johannesburg',
    'sydney': 'Australia/Sydney',
    'us-central': 'America/Chicago',
    'us-east': 'America/New_York',
    'us-south': 'America/Denver',
    'us-west': 'America/Los_Angeles'
};

export abstract class TimezoneUtils {
    public static get_timezone_from_region(region: string) {
        return regions[region] ?? 'America/New_York';
    }
}