import AbstractProvider, {
  EndpointArgument,
  ParseArgument,
  SearchResult,
  RequestType,
} from './provider';

interface RequestResult {
  spatialReference: { wkid: number; latestWkid: number };
  suggestions: RawResult[];
  candidates: RawResult[];
}

interface RawResult {
  isCollection: boolean;
  magicKey: string;
  text: string;
  attributes: {
    LongLabel: string;
    X: number;
    Y: number;
    Xmin: number;
    Xmax: number;
    Ymin: number;
    Ymax: number;
  }
}

export default class EsriProvider extends AbstractProvider<
  RequestResult,
  RawResult
> {
  searchUrl =
    'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest';
  candidateUrl =
    'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates';

  endpoint({ query, type }: EndpointArgument) {
    const params = typeof query === 'string' ? type === RequestType.SEARCH ? { text: query } : { SingleLine: query } : query;
    params.f = 'json';
    if (type === RequestType.CANDIDATE) {
      params.outSR=`{"wkid": 27700}`;
      params.outFields=`*`;
    }

    let url = type === RequestType.SEARCH ? this.searchUrl : this.candidateUrl;
    return this.getUrl(url, params);
  }

  parse(result: ParseArgument<RequestResult>): SearchResult<RawResult>[] {
    if (result.type === RequestType.SEARCH) {
      return result.data.suggestions.map((r) => ({
        x: 0,
        y: 0,
        label: r.text,
        bounds: [
          [0, 0], // s, w
          [0, 0], // n, e
        ],
        raw: r,
      }));
    } else {
      return result.data.candidates.map((r) => ({
        x: r.attributes.X,
        y: r.attributes.Y,
        label: r.attributes.LongLabel,
        bounds: [
          [r.attributes.Ymin, r.attributes.Xmin], // s, w
          [r.attributes.Ymax, r.attributes.Xmax], // n, e
        ],
        raw: r,
      }));
    }
  }
}
