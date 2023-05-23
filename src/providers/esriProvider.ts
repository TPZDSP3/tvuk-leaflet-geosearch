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

    /*
    let barf = {
      "spatialReference":{"wkid":27700,"latestWkid":27700},
      "candidates":[
        { 
          "attributes": {
            "LongLabel":"SG5 4EF, GBR",
            "X":-0.23099997091620139,
            "Y":52.017249982812103,
            "Xmin":-0.23199997091620139,
            "Xmax":-0.22999997091620139,
            "Ymin":52.016249982812106,
            "Ymax":52.018249982812101
          }
        }
      ]
    }
    */
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
