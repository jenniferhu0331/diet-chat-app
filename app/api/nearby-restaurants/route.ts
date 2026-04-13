import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lat, lng } = body;

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Missing latitude or longitude" },
        { status: 400 }
      );
    }

    // 使用Overpass API查询附近的餐厅（完全免费）
    // 搜索范围：0.015度 ≈ 1.5km
    const radius = 0.015;
    const south = lat - radius;
    const north = lat + radius;
    const west = lng - radius;
    const east = lng + radius;

    // Overpass QL查询语句 - 查找餐厅、咖啡厅、便利店等
    const overpassQuery = `
      [out:json][timeout:25][bbox:${south},${west},${north},${east}];
      (
        node["amenity"~"restaurant|cafe|fast_food|bar|food_court"];
        way["amenity"~"restaurant|cafe|fast_food|bar|food_court"];
      );
      out center;
    `;

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: overpassQuery,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "MyNextApp/1.0 (contact: your@email.com)" // 良好的 API 習慣
      },
    });

    const data = await response.json();

    if (data.elements && data.elements.length > 0) {
      const places = data.elements
        .filter((el: any) => el.tags && el.tags.name) // 先篩選有名字的
        .slice(0, 8)                                 // 再取前 8 個
        .map((el: any) => {
          const name = el.tags.name;
          const type = el.tags.amenity;
          const typeLabel = ({
            restaurant: "餐廳",
            cafe: "咖啡廳",
            fast_food: "速食店",
            bar: "酒吧",
            food_court: "美食廣場",
            } as Record<string, string>)[type] || "食物店";

          return `${name} (${typeLabel})`;
        });

      if (places.length > 0) {
        return NextResponse.json({
          options: places,
          source: "overpass",
        });
      }
    }

    // 如果没找到，返回模拟数据
    const mockRestaurants = [
      "台北101美食街 - 中式料理",
      "南京東路餐廳 - 日式料理",
      "信義區小館 - 台灣菜",
      "東區咖啡廳 - 輕食",
      "大安森林公園旁餐廳 - 義式料理",
    ];

    return NextResponse.json({
      options: mockRestaurants,
      source: "mock",
    });
  } catch (error) {
    console.error("Overpass API error:", error);

    // 出錯時返回模擬數據
    const mockRestaurants = [
      "台北101美食街 - 中式料理",
      "南京東路餐廳 - 日式料理",
      "信義區小館 - 台灣菜",
      "東區咖啡廳 - 輕食",
      "大安森林公園旁餐廳 - 義式料理",
    ];

    return NextResponse.json({
      options: mockRestaurants,
      source: "mock_fallback",
    });
  }
}
