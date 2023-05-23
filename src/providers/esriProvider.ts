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
  address: string;
  location: {
    x: number;
    y: number;
  },
  extent: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
}

/*
interface RequestResult {
  spatialReference: { wkid: number; latestWkid: number };
  locations: RawResult[];
}

interface RawResult {
  name: string;
  extent: {
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
  };
  feature: {
    geometry: { x: number; y: number };
    attributes: { Score: number; Addr_Type: string };
  };
}
*/

export default class EsriProvider extends AbstractProvider<
  RequestResult,
  RawResult
> {
  searchUrl =
    'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/suggest';
  candidateUrl =
    'https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates';

  endpoint({ query, type }: EndpointArgument) {
    console.log("Endpoint query: '" + query + "' " + type);
    const params = typeof query === 'string' ? type === RequestType.SEARCH ? { text: query } : { SingleLine: query } : query;
    params.f = 'json';
    if (type === RequestType.CANDIDATE) {
      params.outSR=`{"wkid": 27700}`;
      params.outFields=`*`;
    }
    console.log("endpoint Params: ", params)

    let url = type === RequestType.SEARCH ? this.searchUrl : this.candidateUrl;
    return this.getUrl(url, params);
  }

  parse(result: ParseArgument<RequestResult>): SearchResult<RawResult>[] {
    console.log("PARSE: ", result)

    if (result.type === RequestType.SEARCH) {
      console.log("Parse SEARCH: ", result)
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
      console.log("Parse CANDIDATE: ", result)
      return result.data.candidates.map((r) => ({
        x: r.location.x,
        y: r.location.y,
        label: r.address,
        bounds: [
          [r.extent.ymin, r.extent.xmin], // s, w
          [r.extent.ymax, r.extent.xmax], // n, e
        ],
        raw: r,
      }));
    }

    /*
    return result.data.locations.map((r) => ({
      x: r.feature.geometry.x,
      y: r.feature.geometry.y,
      label: r.name,
      bounds: [
        [r.extent.ymin, r.extent.xmin], // s, w
        [r.extent.ymax, r.extent.xmax], // n, e
      ],
      raw: r,
    }));
    */
  }
}
